const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const cloudWatch = require('../utils/cloudWatch');

const getAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let dateFilter = "NOW() - INTERVAL '7 days'";
    if (period === '30d') dateFilter = "NOW() - INTERVAL '30 days'";
    if (period === '90d') dateFilter = "NOW() - INTERVAL '90 days'";

    const ordersResult = await db.query(
      `SELECT COUNT(*) as total_orders,
              COALESCE(SUM(total_amount), 0) as total_revenue,
              COALESCE(AVG(total_amount), 0) as avg_order_value,
              COUNT(DISTINCT user_id) as unique_customers
       FROM orders
       WHERE created_at >= ${dateFilter}`,
      []
    );

    const restaurantsResult = await db.query(
      `SELECT COUNT(*) as total_restaurants,
              COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_restaurants
       FROM restaurants`
    );

    const usersResult = await db.query(
      `SELECT COUNT(*) as total_users,
              COUNT(CASE WHEN created_at >= ${dateFilter} THEN 1 END) as new_users
       FROM users`
    );

    const topRestaurants = await db.query(
      `SELECT r.id, r.name, r.city, COUNT(o.id) as order_count,
              COALESCE(SUM(o.total_amount), 0) as revenue,
              r.rating, r.review_count
       FROM restaurants r
       LEFT JOIN orders o ON r.id = o.restaurant_id AND o.created_at >= ${dateFilter}
       GROUP BY r.id, r.name, r.city, r.rating, r.review_count
       ORDER BY revenue DESC
       LIMIT 10`
    );

    const topItems = await db.query(
      `SELECT mi.id, mi.name, mi.price, r.name as restaurant_name,
              COUNT(oi.id) as order_count, SUM(oi.quantity) as total_quantity
       FROM menu_items mi
       JOIN restaurants r ON mi.restaurant_id = r.id
       LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= ${dateFilter}
       GROUP BY mi.id, mi.name, mi.price, r.name
       ORDER BY total_quantity DESC NULLS LAST
       LIMIT 10`
    );

    const dailyOrders = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       WHERE created_at >= ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({
      analytics: {
        orders: ordersResult.rows[0],
        restaurants: restaurantsResult.rows[0],
        users: usersResult.rows[0],
      },
      topRestaurants: topRestaurants.rows,
      topItems: topItems.rows,
      dailyOrders: dailyOrders.rows,
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, first_name, last_name, phone, role, is_verified, created_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    const countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (role) {
      countParamCount++;
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (email ILIKE $${countParamCount} OR first_name ILIKE $${countParamCount} OR last_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const existing = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await db.query(
      'UPDATE users SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, first_name, last_name, phone, role, is_verified',
      [isVerified, id]
    );

    await cloudWatch.trackUserActivity(req.user.id, 'update_user_status');

    logger.info('User status updated:', { userId: id, isVerified });

    res.json({
      message: 'User status updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

const getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, city, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.first_name, u.last_name, u.email as owner_email,
             COUNT(DISTINCT mi.id) as menu_item_count,
             COUNT(DISTINCT o.id) as total_orders
      FROM restaurants r
      JOIN users u ON r.owner_id = u.id
      LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
      LEFT JOIN orders o ON r.id = o.restaurant_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (isActive !== undefined) {
      paramCount++;
      query += ` AND r.is_active = $${paramCount}`;
      params.push(isActive === 'true');
    }

    if (city) {
      paramCount++;
      query += ` AND r.city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (r.name ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY r.id, u.first_name, u.last_name, u.email ORDER BY r.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    const countQuery = 'SELECT COUNT(*) FROM restaurants r WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (isActive !== undefined) {
      countParamCount++;
      countQuery += ` AND r.is_active = $${countParamCount}`;
      countParams.push(isActive === 'true');
    }

    if (city) {
      countParamCount++;
      countQuery += ` AND r.city ILIKE $${countParamCount}`;
      countParams.push(`%${city}%`);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (r.name ILIKE $${countParamCount} OR r.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      restaurants: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get all restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, r.name as restaurant_name, u.first_name, u.last_name,
             ua.city, ua.state
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN users u ON o.user_id = u.id
      JOIN user_addresses ua ON o.address_id = ua.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    const countQuery = 'SELECT COUNT(*) FROM orders WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

module.exports = {
  getAnalytics,
  getAllUsers,
  updateUserStatus,
  getAllRestaurants,
  getAllOrders,
};
