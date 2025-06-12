const express = require('express');
const router = express.Router();
const publisherController = require('../controllers/publisherController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

// Xem danh sách và chi tiết: ai cũng xem được
router.get('/', authenticateToken, publisherController.getAllPublishers);
router.get('/:id', authenticateToken, publisherController.getPublisherById);

// Thêm, sửa, xóa: chỉ admin và thủ thư
router.post('/', authenticateToken, isAdminOrLibrarian, publisherController.createPublisher);
router.put('/:id', authenticateToken, isAdminOrLibrarian, publisherController.updatePublisher);
router.delete('/:id', authenticateToken, isAdminOrLibrarian, publisherController.deletePublisher);

module.exports = router;
