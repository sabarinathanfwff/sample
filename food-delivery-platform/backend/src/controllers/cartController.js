const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const cloudWatch = require('../utils/cloudWatch');

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT ci.*, mi.name, mi.price, mi.image_url, mi.preparation_time,
              r.name as restaurant_name, r.city, r.minimum_order, r.delivery_fee
       FROM cart_items ci
       JOIN menu_items mi ON ci.menu_item_id = mi.id
       JOIN restaurants r ON ci.restaurant_id = r.id
       WHERE ci.user_id = $1 AND mi.is_available = TRUE AND r.is_active = TRUE
       ORDER BY ci.created_at DESC`,
      [userId]
    );

    const summary = result.rows.reduce(
      (acc, item) => {
        const restaurantTotal = acc.restaurantTotals[item.restaurant_id] || 0;
        acc.restaurantTotals[item.restaurant_id] = restaurantTotal + item.price * item.quantity;
        acc.subtotal += item.price * item.quantity;
        acc.items.push(item);
        return acc;
      },
      { subtotal: 0, restaurantTotals: {}, items: [] }
    );

    res.json({
      items: summary.items,
      subtotal: summary.subtotal,
      restaurantTotals: summary.restaurantTotals,
      itemCount: summary.items.length,
    });
  } catch (error) {
    logger.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { menuItemId, quantity = 1, specialRequests } = req.body;

    const menuItem = await db.query(
      'SELECT mi.*, r.id as restaurant_id FROM menu_items mi JOIN restaurants r ON mi.restaurant_id = r.id WHERE mi.id = $1 AND mi.is_available = TRUE AND r.is_active = TRUE',
      [menuItemId]
    );

    if (menuItem.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found or unavailable' });
    }

    const existingCartItem = await db.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND menu_item_id = $2',
      [userId, menuItemId]
    );

    let result;
    if (existingCartItem.rows.length > 0) {
      result = await db.query(
        'UPDATE cart_items SET quantity = quantity + $1, special_requests = COALESCE($2, special_requests), updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND menu_item_id = $4 RETURNING *',
        [quantity, specialRequests, userId, menuItemId]
      );
    } else {
      result = await db.query(
        'INSERT INTO cart_items (user_id, menu_item_id, restaurant_id, quantity, special_requests) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, menuItemId, menuItem.rows[0].restaurant_id, quantity, specialRequests]
      );
    }

    await cloudWatch.trackUserActivity(userId, 'add_to_cart');

    logger.info('Item added to cart:', { userId, menuItemId, quantity });

    res.status(201).json({
      message: 'Item added to cart',
      cartItem: result.rows[0],
    });
  } catch (error) {
    logger.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity, specialRequests } = req.body;

    const existing = await db.query('SELECT * FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const result = await db.query(
      'UPDATE cart_items SET quantity = $1, special_requests = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [quantity, specialRequests, id]
    );

    await cloudWatch.trackUserActivity(userId, 'update_cart_item');

    logger.info('Cart item updated:', { cartItemId: id });

    res.json({
      message: 'Cart item updated successfully',
      cartItem: result.rows[0],
    });
  } catch (error) {
    logger.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await db.query('DELETE FROM cart_items WHERE id = $1', [id]);

    await cloudWatch.trackUserActivity(userId, 'remove_from_cart');

    logger.info('Item removed from cart:', { userId, cartItemId: id });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    logger.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    await cloudWatch.trackUserActivity(userId, 'clear_cart');

    logger.info('Cart cleared:', { userId });

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    logger.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
