const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', menuController.getMenuItems);
router.get('/:id', menuController.getMenuItemById);
router.post('/restaurant/:restaurantId', authenticate, authorize('restaurant_owner', 'admin'), menuController.createMenuItem);
router.put('/:id', authenticate, authorize('restaurant_owner', 'admin'), menuController.updateMenuItem);
router.delete('/:id', authenticate, authorize('restaurant_owner', 'admin'), menuController.deleteMenuItem);

module.exports = router;
