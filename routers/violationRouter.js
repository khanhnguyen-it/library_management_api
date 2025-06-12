const express = require('express');
const router = express.Router();
const violationController = require('../controllers/violationController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

// Ghi nhận vi phạm mới
router.post(
    '/create',
    authenticateToken,
    isAdminOrLibrarian,
    violationController.createViolation
);

// Lấy danh sách vi phạm theo account
router.get(
    '/by-account/:account_id',
    authenticateToken,
    isAdminOrLibrarian,
    violationController.getViolationsByAccount
);

// Lấy chi tiết vi phạm theo ID
router.get(
    '/:id',
    authenticateToken,
    isAdminOrLibrarian,
    violationController.getViolationById
);

// Cập nhật trạng thái vi phạm (PAID, WAIVED)
router.patch(
    '/:id/status',
    authenticateToken,
    isAdminOrLibrarian,
    violationController.updateViolationStatus
);

module.exports = router;
