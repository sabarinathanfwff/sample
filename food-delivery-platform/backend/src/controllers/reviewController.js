const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const cloudWatch = require('../utils/cloudWatch');

const getReviews = async (req, res) => {
  try {
    const { restaurantId, menuItemId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT rv.*, u.first_name, u.last_name, u.avatar_url
      FROM reviews rv
      JOIN users u ON rv.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (restaurantId) {
      paramCount++;
      query += ` AND rv.restaurant_id = $${paramCount}`;
      params.push(restaurantId);
    }

    if (menuItemId) {
      paramCount++;
      query += ` AND rv.menu_item_id = $${paramCount}`;
      params.push(menuItemId);
    }

    query += ` ORDER BY rv.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM reviews rv WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (restaurantId) {
      countParamCount++;
      countQuery += ` AND rv.restaurant_id = $${countParamCount}`;
      countParams.push(restaurantId);
    }

    if (menuItemId) {
      countParamCount++;
      countQuery += ` AND rv.menu_item_id = $${countParamCount}`;
      countParams.push(menuItemId);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { restaurantId, menuItemId, orderId, rating, comment, images } = req.body;

    if (!restaurantId && !menuItemId) {
      return res.status(400).json({ error: 'Either restaurantId or menuItemId is required' });
    }

    const order = await db.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.rows[0].status !== 'delivered') {
      return res.status(400).json({ error: 'Can only review delivered orders' });
    }

    const existingReview = await db.query(
      'SELECT * FROM reviews WHERE user_id = $1 AND order_id = $2',
      [userId, orderId]
    );
    if (existingReview.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this order' });
    }

    const result = await db.query(
      'INSERT INTO reviews (user_id, restaurant_id, menu_item_id, order_id, rating, comment, images, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, restaurantId, menuItemId, orderId, rating, comment, images || [], true]
    );

    await cloudWatch.trackUserActivity(userId, 'create_review');

    logger.info('Review created:', { reviewId: result.rows[0].id, userId });

    res.status(201).json({
      message: 'Review created successfully',
      review: result.rows[0],
    });
  } catch (error) {
    logger.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, comment, images } = req.body;

    const existing = await db.query('SELECT * FROM reviews WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const result = await db.query(
      'UPDATE reviews SET rating = $1, comment = $2, images = $3, is_verified = TRUE WHERE id = $4 RETURNING *',
      [rating, comment, images || existing.rows[0].images, id]
    );

    await cloudWatch.trackUserActivity(userId, 'update_review');

    logger.info('Review updated:', { reviewId: id });

    res.json({
      message: 'Review updated successfully',
      review: result.rows[0],
    });
  } catch (error) {
    logger.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM reviews WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await db.query('DELETE FROM reviews WHERE id = $1', [id]);

    await cloudWatch.trackUserActivity(userId, 'delete_review');

    logger.info('Review deleted:', { reviewId: id });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT rv.*, r.name as restaurant_name, mi.name as menu_item_name
       FROM reviews rv
       LEFT JOIN restaurants r ON rv.restaurant_id = r.id
       LEFT JOIN menu_items mi ON rv.menu_item_id = mi.id
       WHERE rv.user_id = $1
       ORDER BY rv.created_at DESC`,
      [userId]
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    logger.error('Get my reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
};
