const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

// Tra cứu tài liệu (khách truy cập được)
router.get('/search', documentController.searchDocuments);

// Ai cũng được xem
router.get('/', authenticateToken, documentController.getAllDocuments);
router.get('/:id', authenticateToken, documentController.getDocumentById);
router.get('/:id/stock', authenticateToken, documentController.getDocumentStock);

// Chỉ admin/thủ thư được thêm/sửa/xoá
router.post('/', authenticateToken, isAdminOrLibrarian, documentController.createDocument);
router.put('/:id', authenticateToken, isAdminOrLibrarian, documentController.updateDocument);
router.delete('/:id', authenticateToken, isAdminOrLibrarian, documentController.deleteDocument);

// Tra cứu tài liệu (khách truy cập được)
router.get('/search', documentController.searchDocuments);

module.exports = router;
