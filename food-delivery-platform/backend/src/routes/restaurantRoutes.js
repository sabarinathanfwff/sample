const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', restaurantController.getRestaurants);
router.get('/my', authenticate, authorize('restaurant_owner'), restaurantController.getMyRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.post('/', authenticate, authorize('restaurant_owner'), restaurantController.createRestaurant);
router.put('/:id', authenticate, authorize('restaurant_owner', 'admin'), restaurantController.updateRestaurant);
router.delete('/:id', authenticate, authorize('restaurant_owner', 'admin'), restaurantController.deleteRestaurant);

module.exports = router;
