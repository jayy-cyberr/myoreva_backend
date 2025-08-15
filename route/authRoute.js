const express = require('express');
const authController = require('../controller/adminAuthController');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

const authRoute = express.Router();

authRoute.post('/login', authController.login);
authRoute.post('/verify', authController.verifyToken);

authRoute.use(authenticateToken);

authRoute.get('/users', requireAdmin, authController.getAllUsers);
authRoute.post('/users', requireAdmin, authController.addUser);
authRoute.put('/users/:userId', requireAdmin, authController.updateUser);
authRoute.delete('/users/:userId', requireAdmin, authController.deleteUser);

module.exports = authRoute;