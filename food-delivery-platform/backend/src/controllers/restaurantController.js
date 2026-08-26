const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');
const cloudWatch = require('../utils/cloudWatch');

const getRestaurants = async (req, res) => {
  try {
    const { city, cuisine, minRating, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.first_name, u.last_name,
             COUNT(DISTINCT mi.id) as menu_item_count
      FROM restaurants r
      JOIN users u ON r.owner_id = u.id
      LEFT JOIN menu_items mi ON r.id = mi.restaurant_id AND mi.is_available = TRUE
      WHERE r.is_active = TRUE
    `;
    const params = [];
    let paramCount = 0;

    if (city) {
      paramCount++;
      query += ` AND r.city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
    }

    if (cuisine) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(r.cuisine_type)`;
      params.push(cuisine);
    }

    if (minRating) {
      paramCount++;
      query += ` AND r.rating >= $${paramCount}`;
      params.push(parseFloat(minRating));
    }

    if (search) {
      paramCount++;
      query += ` AND (r.name ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY r.id, u.first_name, u.last_name ORDER BY r.rating DESC, r.review_count DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    const countQuery = `
      SELECT COUNT(*) FROM restaurants r
      WHERE r.is_active = TRUE
    `;
    let countParams = [];
    let countParamCount = 0;

    if (city) {
      countParamCount++;
      countQuery += ` AND r.city ILIKE $${countParamCount}`;
      countParams.push(`%${city}%`);
    }

    if (cuisine) {
      countParamCount++;
      countQuery += ` AND $${countParamCount} = ANY(r.cuisine_type)`;
      countParams.push(cuisine);
    }

    if (minRating) {
      countParamCount++;
      countQuery += ` AND r.rating >= $${countParamCount}`;
      countParams.push(parseFloat(minRating));
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
    logger.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email as owner_email
       FROM restaurants r
       JOIN users u ON r.owner_id = u.id
       WHERE r.id = $1 AND r.is_active = TRUE`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const menuResult = await db.query(
      'SELECT * FROM menu_items WHERE restaurant_id = $1 AND is_available = TRUE ORDER BY is_featured DESC, rating DESC',
      [id]
    );

    const reviewsResult = await db.query(
      `SELECT rv.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews rv
       JOIN users u ON rv.user_id = u.id
       WHERE rv.restaurant_id = $1
       ORDER BY rv.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      restaurant: result.rows[0],
      menu: menuResult.rows,
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    logger.error('Get restaurant by id error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      description,
      cuisineType,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      phone,
      email,
      imageUrl,
      coverImageUrl,
      openingTime,
      closingTime,
      deliveryTime,
      minimumOrder,
      deliveryFee,
    } = req.body;

    const result = await db.query(
      `INSERT INTO restaurants (owner_id, name, description, cuisine_type, address, city, state, zip_code, latitude, longitude, phone, email, image_url, cover_image_url, opening_time, closing_time, delivery_time, minimum_order, delivery_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        userId, name, description, cuisineType, address, city, state, zipCode,
        latitude, longitude, phone, email, imageUrl, coverImageUrl,
        openingTime || '10:00:00', closingTime || '22:00:00',
        deliveryTime || 30, minimumOrder || 0, deliveryFee || 2.99,
      ]
    );

    await cloudWatch.trackUserActivity(userId, 'create_restaurant');

    logger.info('Restaurant created:', { restaurantId: result.rows[0].id, ownerId: userId });

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant: result.rows[0],
    });
  } catch (error) {
    logger.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (existing.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this restaurant' });
    }

    const {
      name,
      description,
      cuisineType,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      phone,
      email,
      imageUrl,
      coverImageUrl,
      openingTime,
      closingTime,
      deliveryTime,
      minimumOrder,
      deliveryFee,
      isActive,
      isOpen,
    } = req.body;

    const result = await db.query(
      `UPDATE restaurants SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       cuisine_type = COALESCE($3, cuisine_type),
       address = COALESCE($4, address),
       city = COALESCE($5, city),
       state = COALESCE($6, state),
       zip_code = COALESCE($7, zip_code),
       latitude = COALESCE($8, latitude),
       longitude = COALESCE($9, longitude),
       phone = COALESCE($10, phone),
       email = COALESCE($11, email),
       image_url = COALESCE($12, image_url),
       cover_image_url = COALESCE($13, cover_image_url),
       opening_time = COALESCE($14, opening_time),
       closing_time = COALESCE($15, closing_time),
       delivery_time = COALESCE($16, delivery_time),
       minimum_order = COALESCE($17, minimum_order),
       delivery_fee = COALESCE($18, delivery_fee),
       is_active = COALESCE($19, is_active),
       is_open = COALESCE($20, is_open),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $21 RETURNING *`,
      [
        name, description, cuisineType, address, city, state, zipCode,
        latitude, longitude, phone, email, imageUrl, coverImageUrl,
        openingTime, closingTime, deliveryTime, minimumOrder, deliveryFee,
        isActive, isOpen, id
      ]
    );

    await cloudWatch.trackUserActivity(userId, 'update_restaurant');

    logger.info('Restaurant updated:', { restaurantId: id });

    res.json({
      message: 'Restaurant updated successfully',
      restaurant: result.rows[0],
    });
  } catch (error) {
    logger.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await db.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (existing.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this restaurant' });
    }

    await db.query('UPDATE restaurants SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    await cloudWatch.trackUserActivity(userId, 'delete_restaurant');

    logger.info('Restaurant deleted:', { restaurantId: id });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    logger.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
};

const getMyRestaurants = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT r.*,
              COUNT(DISTINCT mi.id) as menu_item_count,
              COUNT(DISTINCT o.id) as total_orders,
              COALESCE(SUM(o.total_amount), 0) as total_revenue
       FROM restaurants r
       LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
       LEFT JOIN orders o ON r.id = o.restaurant_id AND o.created_at >= NOW() - INTERVAL '30 days'
       WHERE r.owner_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({ restaurants: result.rows });
  } catch (error) {
    logger.error('Get my restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getMyRestaurants,
};
