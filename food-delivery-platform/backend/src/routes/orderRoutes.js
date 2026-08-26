const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, orderController.getOrders);
router.get('/restaurant', authenticate, authorize('restaurant_owner'), orderController.getRestaurantOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.post('/', authenticate, orderController.createOrder);
router.put('/:id/status', authenticate, authorize('restaurant_owner', 'admin'), orderController.updateOrderStatus);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;
