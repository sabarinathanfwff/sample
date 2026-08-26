const db = require('../config/database');

class Restaurant {
  static async findAll() {
    const result = await db.query('SELECT * FROM restaurants WHERE is_active = TRUE');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await db.query(
      'INSERT INTO restaurants (name, description, cuisine_type, address, city, state, zip_code, phone, owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [data.name, data.description, data.cuisineType, data.address, data.city, data.state, data.zipCode, data.phone, data.ownerId]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await db.query('UPDATE restaurants SET name = $1, description = $2 WHERE id = $3 RETURNING *', [data.name, data.description, id]);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('UPDATE restaurants SET is_active = FALSE WHERE id = $1', [id]);
  }
}

module.exports = { Restaurant };
