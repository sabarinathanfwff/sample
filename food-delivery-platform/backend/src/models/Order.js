const db = require('../config/database');

class Order {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.userId) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await db.query(
      'INSERT INTO orders (user_id, restaurant_id, address_id, total_amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.userId, data.restaurantId, data.addressId, data.totalAmount, data.status]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await db.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [status, id]);
    return result.rows[0];
  }
}

module.exports = { Order };
