const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

// Xem danh sách và chi tiết: ai cũng xem được sau khi đăng nhập
router.get('/', authenticateToken, categoryController.getAllCategories);
router.get('/:id', authenticateToken, categoryController.getCategoryById);

// Thêm, sửa, xóa: chỉ admin và thủ thư
router.post('/', authenticateToken, isAdminOrLibrarian, categoryController.createCategory);
router.put('/:id', authenticateToken, isAdminOrLibrarian, categoryController.updateCategory);
router.delete('/:id', authenticateToken, isAdminOrLibrarian, categoryController.deleteCategory);

module.exports = router;
