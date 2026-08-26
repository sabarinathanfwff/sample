const db = require('../config/database');

class MenuItem {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM menu_items WHERE is_available = TRUE';
    const params = [];
    let paramCount = 0;

    if (filters.restaurantId) {
      paramCount++;
      query += ` AND restaurant_id = $${paramCount}`;
      params.push(filters.restaurantId);
    }

    if (filters.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await db.query(
      'INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.restaurantId, data.name, data.description, data.price, data.category]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await db.query(
      'UPDATE menu_items SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING *',
      [data.name, data.description, data.price, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('UPDATE menu_items SET is_available = FALSE WHERE id = $1', [id]);
  }
}

module.exports = { MenuItem };
