const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const cloudWatch = require('../utils/cloudWatch');

const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image,
             ua.address_line1, ua.city, ua.state, ua.zip_code,
             u.first_name, u.last_name
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN user_addresses ua ON o.address_id = ua.id
      JOIN users u ON o.user_id = u.id
      WHERE o.user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    const countQuery = 'SELECT COUNT(*) FROM orders WHERE user_id = $1';
    const countParams = [userId];
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image,
              r.phone as restaurant_phone, r.email as restaurant_email,
              ua.address_line1, ua.address_line2, ua.city, ua.state, ua.zip_code,
              u.first_name, u.last_name, u.phone as user_phone, u.email as user_email
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN user_addresses ua ON o.address_id = ua.id
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1 AND (o.user_id = $2 OR r.owner_id = $2 OR $3 = 'admin')`,
      [id, userId, req.user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderItems = await db.query(
      'SELECT oi.*, mi.name, mi.image_url FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = $1',
      [id]
    );

    res.json({
      order: result.rows[0],
      items: orderItems.rows,
    });
  } catch (error) {
    logger.error('Get order by id error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { restaurantId, addressId, paymentMethod, specialInstructions } = req.body;

    const cartItems = await db.query(
      `SELECT ci.*, mi.price, mi.name, r.minimum_order, r.delivery_fee
       FROM cart_items ci
       JOIN menu_items mi ON ci.menu_item_id = mi.id
       JOIN restaurants r ON ci.restaurant_id = r.id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const restaurantIdFromCart = cartItems.rows[0].restaurant_id;
    if (restaurantIdFromCart !== restaurantId) {
      return res.status(400).json({ error: 'All items must be from the same restaurant' });
    }

    const subtotal = cartItems.rows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const minimumOrder = cartItems.rows[0].minimum_order;
    const deliveryFee = cartItems.rows[0].delivery_fee;

    if (subtotal < minimumOrder) {
      return res.status(400).json({
        error: `Minimum order amount is $${minimumOrder}. Current subtotal: $${subtotal}`,
      });
    }

    const tax = subtotal * 0.08;
    const totalAmount = subtotal + deliveryFee + tax;

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const orderResult = await db.query(
      `INSERT INTO orders (user_id, restaurant_id, address_id, order_number, payment_method, subtotal, delivery_fee, tax, discount, total_amount, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [userId, restaurantId, addressId, orderNumber, paymentMethod, subtotal, deliveryFee, tax, 0, totalAmount, specialInstructions]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of cartItems.rows) {
      await db.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_requests) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderId, item.menu_item_id, item.quantity, item.price, item.price * item.quantity, item.special_requests]
      );
    }

    await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    const paymentResult = await db.query(
      'INSERT INTO payments (order_id, amount, payment_method, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [orderId, totalAmount, paymentMethod, 'completed']
    );

    await cloudWatch.trackOrder({
      restaurantId,
      status: 'pending',
    });

    logger.info('Order created:', { orderId, userId, orderNumber });

    res.status(201).json({
      message: 'Order placed successfully',
      order: orderResult.rows[0],
      payment: paymentResult.rows[0],
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await db.query(
      'SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existing.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (status === 'delivered') {
      await db.query('UPDATE orders SET delivered_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    }

    await cloudWatch.trackOrder({
      restaurantId: existing.rows[0].restaurant_id,
      status,
    });

    logger.info('Order status updated:', { orderId: id, status });

    res.json({
      message: 'Order status updated successfully',
      order: result.rows[0],
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existing.rows[0].status !== 'pending' && existing.rows[0].status !== 'confirmed') {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    await db.query(
      "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    await db.query(
      "UPDATE payments SET status = 'refunded' WHERE order_id = $1",
      [id]
    );

    await cloudWatch.trackUserActivity(userId, 'cancel_order');

    logger.info('Order cancelled:', { orderId: id, userId });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

const getRestaurantOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.first_name, u.last_name, u.phone as user_phone,
             ua.address_line1, ua.city, ua.state, ua.zip_code
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN users u ON o.user_id = u.id
      JOIN user_addresses ua ON o.address_id = ua.id
      WHERE r.owner_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    const countQuery = 'SELECT COUNT(*) FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE r.owner_id = $1';
    const countParams = [userId];
    if (status) {
      countQuery += ' AND o.status = $2';
      countParams.push(status);
    }
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get restaurant orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getRestaurantOrders,
};
