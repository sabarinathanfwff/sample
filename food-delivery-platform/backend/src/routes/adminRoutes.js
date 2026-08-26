const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/analytics', authenticate, authorize('admin'), adminController.getAnalytics);
router.get('/users', authenticate, authorize('admin'), adminController.getAllUsers);
router.put('/users/:id/status', authenticate, authorize('admin'), adminController.updateUserStatus);
router.get('/restaurants', authenticate, authorize('admin'), adminController.getAllRestaurants);
router.get('/orders', authenticate, authorize('admin'), adminController.getAllOrders);

module.exports = router;
