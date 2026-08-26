const db = require('../config/database');

class Review {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM reviews WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.restaurantId) {
      paramCount++;
      query += ` AND restaurant_id = $${paramCount}`;
      params.push(filters.restaurantId);
    }

    if (filters.menuItemId) {
      paramCount++;
      query += ` AND menu_item_id = $${paramCount}`;
      params.push(filters.menuItemId);
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM reviews WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await db.query(
      'INSERT INTO reviews (user_id, restaurant_id, menu_item_id, order_id, rating, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [data.userId, data.restaurantId, data.menuItemId, data.orderId, data.rating, data.comment]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await db.query(
      'UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 RETURNING *',
      [data.rating, data.comment, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM reviews WHERE id = $1', [id]);
  }
}

module.exports = { Review };
