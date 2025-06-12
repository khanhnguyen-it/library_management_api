// routes/statistic.routes.js
const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statisticController');
const authenticateToken = require('../middlewares/authenticateToken');
const isLibrarian = require('../middlewares/isLibrarian');

// Tạo thống kê theo khoảng thời gian
router.post('/generate', authenticateToken, isLibrarian, statisticController.generateStatistic);

// Thống kê tổng số tài liệu theo tình trạng
router.get('/documents/status', authenticateToken, isLibrarian, statisticController.getDocumentStatus);

// Lượt mượn theo ngày/tháng/năm
router.get('/borrowing-summary', authenticateToken, isLibrarian, statisticController.getBorrowingSummary);

// Top tài liệu mượn nhiều nhất
router.get('/top-borrowed', authenticateToken, isLibrarian, statisticController.getTopBorrowedDocuments);

// Thống kê vi phạm theo thời gian
router.get('/violations', authenticateToken, isLibrarian, statisticController.getViolationStats);

module.exports = router;