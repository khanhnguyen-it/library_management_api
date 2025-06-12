const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdmin = require('../middlewares/isAdmin');

// Lấy danh sách vai trò
router.get('/', authenticateToken, isAdmin, roleController.getAllRoles);

// Cập nhật vai trò người dùng
router.put('/update-role', authenticateToken, isAdmin, roleController.updateUserRole);

// Tạo vai trò mới
router.post('/create', authenticateToken, isAdmin, roleController.createRole);

// Xóa vai trò
router.delete('/:role_id', authenticateToken, isAdmin, roleController.deleteRole);


module.exports = router;
