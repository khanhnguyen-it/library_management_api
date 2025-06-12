const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

// 🔐 Lấy tất cả payments theo account_id
router.get(
    '/by-account/:account_id',
    authenticateToken,
    isAdminOrLibrarian,
    paymentController.getPaymentsByAccount
);

// 🔐 Lấy payments theo violation_id
router.get(
    '/by-violation/:violation_id',
    authenticateToken,
    isAdminOrLibrarian,
    paymentController.getPaymentsByViolation
);

// 🔐 Lấy payments theo borrowing_id
router.get(
    '/by-borrowing/:borrowing_id',
    authenticateToken,
    isAdminOrLibrarian,
    paymentController.getPaymentsByBorrowing
);

// 🔐 Xác nhận thanh toán (chuyển status = COMPLETED)
router.patch(
    '/confirm/:id',
    authenticateToken,
    isAdminOrLibrarian,
    paymentController.confirmPayment
);

// 🔐 Tạo thanh toán thủ công
router.post(
    '/create-manual',
    authenticateToken,
    isAdminOrLibrarian,
    paymentController.createManualPayment
);

// 🔐 Hoàn tiền đặt cọc sau khi trả tài liệu đúng hạn
router.post(
    '/refund-deposit',
    authenticateToken,
    isAdminOrLibrarian,
    paymentController.refundDeposit
);

// 🔐 Xử lý đặt giữ hết hạn → mất cọc + sinh vi phạm
router.post(
    '/reservation-expired',
    authenticateToken,
    isAdminOrLibrarian,
    paymentController.handleExpiredReservation
);

module.exports = router;
