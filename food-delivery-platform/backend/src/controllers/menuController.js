const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const cloudWatch = require('../utils/cloudWatch');

const getMenuItems = async (req, res) => {
  try {
    const { restaurantId, category, isVegetarian, isVegan, isGlutenFree, isFeatured, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT mi.*, r.name as restaurant_name, r.city, r.rating as restaurant_rating
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE mi.is_available = TRUE AND r.is_active = TRUE
    `;
    const params = [];
    let paramCount = 0;

    if (restaurantId) {
      paramCount++;
      query += ` AND mi.restaurant_id = $${paramCount}`;
      params.push(restaurantId);
    }

    if (category) {
      paramCount++;
      query += ` AND mi.category = $${paramCount}`;
      params.push(category);
    }

    if (isVegetarian === 'true') {
      paramCount++;
      query += ` AND mi.is_vegetarian = TRUE`;
    }

    if (isVegan === 'true') {
      paramCount++;
      query += ` AND mi.is_vegan = TRUE`;
    }

    if (isGlutenFree === 'true') {
      paramCount++;
      query += ` AND mi.is_gluten_free = TRUE`;
    }

    if (isFeatured === 'true') {
      paramCount++;
      query += ` AND mi.is_featured = TRUE`;
    }

    if (search) {
      paramCount++;
      query += ` AND (mi.name ILIKE $${paramCount} OR mi.description ILIKE $${paramCount})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY mi.is_featured DESC, mi.rating DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    const countQuery = `SELECT COUNT(*) FROM menu_items mi JOIN restaurants r ON mi.restaurant_id = r.id WHERE mi.is_available = TRUE AND r.is_active = TRUE`;
    let countParams = [];
    let countParamCount = 0;

    if (restaurantId) {
      countParamCount++;
      countQuery += ` AND mi.restaurant_id = $${countParamCount}`;
      countParams.push(restaurantId);
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND mi.category = $${countParamCount}`;
      countParams.push(category);
    }

    if (isVegetarian === 'true') {
      countQuery += ` AND mi.is_vegetarian = TRUE`;
    }

    if (isVegan === 'true') {
      countQuery += ` AND mi.is_vegan = TRUE`;
    }

    if (isGlutenFree === 'true') {
      countQuery += ` AND mi.is_gluten_free = TRUE`;
    }

    if (isFeatured === 'true') {
      countQuery += ` AND mi.is_featured = TRUE`;
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (mi.name ILIKE $${countParamCount} OR mi.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      menuItems: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get menu items error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT mi.*, r.name as restaurant_name, r.city, r.rating as restaurant_rating
       FROM menu_items mi
       JOIN restaurants r ON mi.restaurant_id = r.id
       WHERE mi.id = $1 AND mi.is_available = TRUE AND r.is_active = TRUE`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const reviewsResult = await db.query(
      `SELECT rv.*, u.first_name, u.last_name
       FROM reviews rv
       JOIN users u ON rv.user_id = u.id
       WHERE rv.menu_item_id = $1
       ORDER BY rv.created_at DESC
       LIMIT 5`,
      [id]
    );

    const similarResult = await db.query(
      `SELECT mi.*, r.name as restaurant_name
       FROM menu_items mi
       JOIN restaurants r ON mi.restaurant_id = r.id
       WHERE mi.restaurant_id = $1 AND mi.id != $2 AND mi.is_available = TRUE
       LIMIT 5`,
      [result.rows[0].restaurant_id, id]
    );

    res.json({
      menuItem: result.rows[0],
      reviews: reviewsResult.rows,
      similarItems: similarResult.rows,
    });
  } catch (error) {
    logger.error('Get menu item by id error:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { restaurantId } = req.params;

    const restaurant = await db.query('SELECT * FROM restaurants WHERE id = $1', [restaurantId]);
    if (restaurant.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (restaurant.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to add items to this restaurant' });
    }

    const {
      name,
      description,
      price,
      category,
      imageUrl,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spiceLevel,
      calories,
      preparationTime,
      isFeatured,
    } = req.body;

    const result = await db.query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_vegetarian, is_vegan, is_gluten_free, spice_level, calories, preparation_time, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        restaurantId, name, description, price, category, imageUrl,
        isVegetarian || false, isVegan || false, isGlutenFree || false,
        spiceLevel || 0, calories, preparationTime, isFeatured || false,
      ]
    );

    await cloudWatch.trackUserActivity(userId, 'create_menu_item');

    logger.info('Menu item created:', { menuItemId: result.rows[0].id, restaurantId });

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem: result.rows[0],
    });
  } catch (error) {
    logger.error('Create menu item error:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query(
      'SELECT mi.*, r.owner_id FROM menu_items mi JOIN restaurants r ON mi.restaurant_id = r.id WHERE mi.id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (existing.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this menu item' });
    }

    const {
      name,
      description,
      price,
      category,
      imageUrl,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spiceLevel,
      calories,
      preparationTime,
      isAvailable,
      isFeatured,
      rating,
    } = req.body;

    const result = await db.query(
      `UPDATE menu_items SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       price = COALESCE($3, price),
       category = COALESCE($4, category),
       image_url = COALESCE($5, image_url),
       is_vegetarian = COALESCE($6, is_vegetarian),
       is_vegan = COALESCE($7, is_vegan),
       is_gluten_free = COALESCE($8, is_gluten_free),
       spice_level = COALESCE($9, spice_level),
       calories = COALESCE($10, calories),
       preparation_time = COALESCE($11, preparation_time),
       is_available = COALESCE($12, is_available),
       is_featured = COALESCE($13, is_featured),
       rating = COALESCE($14, rating),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $15 RETURNING *`,
      [
        name, description, price, category, imageUrl,
        isVegetarian, isVegan, isGlutenFree, spiceLevel, calories,
        preparationTime, isAvailable, isFeatured, rating, id
      ]
    );

    await cloudWatch.trackUserActivity(userId, 'update_menu_item');

    logger.info('Menu item updated:', { menuItemId: id });

    res.json({
      message: 'Menu item updated successfully',
      menuItem: result.rows[0],
    });
  } catch (error) {
    logger.error('Update menu item error:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query(
      'SELECT mi.*, r.owner_id FROM menu_items mi JOIN restaurants r ON mi.restaurant_id = r.id WHERE mi.id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (existing.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this menu item' });
    }

    await db.query('UPDATE menu_items SET is_available = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    await cloudWatch.trackUserActivity(userId, 'delete_menu_item');

    logger.info('Menu item deleted:', { menuItemId: id });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    logger.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
