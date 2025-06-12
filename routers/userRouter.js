const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');



// Lấy thông tin người dùng (cần đăng nhập)
router.get('/me', authenticateToken, userController.getUserInfo);

// Cập nhật thông tin người dùng
router.put('/me', authenticateToken, userController.updateUserSelf);
router.put('/:id', authenticateToken, isAdminOrLibrarian, userController.updateUserByAdmin);

module.exports = router;