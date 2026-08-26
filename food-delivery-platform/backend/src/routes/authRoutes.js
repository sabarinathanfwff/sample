const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');

router.post('/register', validateBody(schemas.register), authController.register);
router.post('/login', validateBody(schemas.login), authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
