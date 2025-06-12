const express = require('express');
const router = express.Router();
const renewalController = require('../controllers/renewalController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

// Gia hạn từng tài liệu trong phiếu mượn
router.post(
    '/extend-item',
    authenticateToken,
    isAdminOrLibrarian,
    renewalController.extendItems
);

module.exports = router;