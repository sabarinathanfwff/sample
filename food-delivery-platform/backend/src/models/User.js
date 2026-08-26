const db = require('../config/database');

class User {
  static async findById(id) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create(data) {
    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [data.email, data.passwordHash, data.firstName, data.lastName, data.phone, data.role]
    );
    return result.rows[0];
  }
}

module.exports = { User };
