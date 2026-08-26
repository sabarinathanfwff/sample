const db = require('../config/database');

class CartItem {
  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT ci.*, mi.name, mi.price, mi.image_url, r.name as restaurant_name
       FROM cart_items ci
       JOIN menu_items mi ON ci.menu_item_id = mi.id
       JOIN restaurants r ON ci.restaurant_id = r.id
       WHERE ci.user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM cart_items WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await db.query(
      'INSERT INTO cart_items (user_id, menu_item_id, restaurant_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.userId, data.menuItemId, data.restaurantId, data.quantity]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await db.query(
      'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [data.quantity, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM cart_items WHERE id = $1', [id]);
  }

  static async clearByUserId(userId) {
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  }
}

module.exports = { CartItem };
