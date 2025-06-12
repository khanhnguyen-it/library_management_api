const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');


// Đăng nhập
router.post('/login', authController.login);

// Đăng xuất
router.post('/logout', authenticateToken, authController.logout);

// Quên mật khẩu - gửi reset token qua email
router.post('/forgot', authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);

// Đổi mật khẩu khi đã đăng nhập
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
