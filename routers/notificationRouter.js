// routes/notification.routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middlewares/authenticateToken');
const isLibrarian = require('../middlewares/isLibrarian');

// Tạo thông báo thủ công (chỉ thủ thư/admin)
router.post('/manual', authenticateToken, isLibrarian, notificationController.createManualNotification);

// Lấy danh sách thông báo theo tài khoản
router.get('/account/:account_id', authenticateToken, notificationController.getNotificationsByAccount);

// Đánh dấu đã đọc
router.post('/mark-read', authenticateToken, notificationController.markAsRead);

// Lấy số lượng thông báo chưa đọc
router.get('/unread-count/:account_id', authenticateToken, notificationController.getUnreadCount);


//Tự động thông báo (chỉ test thủ công, có thể gọi qua cron job)
// Gửi thông báo phiếu mượn quá hạn
router.get('/auto/overdue-borrows', authenticateToken, isLibrarian, async (req, res) => {
    await notificationController.autoNotifyOverdueBorrows();
    res.json({ message: 'Đã gửi thông báo quá hạn mượn' });
});

// Gửi thông báo phiếu mượn sắp hết hạn
router.get('/auto/due-soon-borrows', authenticateToken, isLibrarian, async (req, res) => {
    await notificationController.autoNotifyDueSoonBorrows();
    res.json({ message: 'Đã gửi thông báo sắp hết hạn mượn' });
});

// Gửi thông báo vi phạm chưa thanh toán
router.get('/auto/unpaid-violations', authenticateToken, isLibrarian, async (req, res) => {
    await notificationController.autoNotifyUnpaidViolations();
    res.json({ message: 'Đã gửi thông báo vi phạm chưa thanh toán' });
});

// Gửi thông báo thẻ thư viện sắp hết hạn
router.get('/auto/expiring-cards', authenticateToken, isLibrarian, async (req, res) => {
    await notificationController.autoNotifyCardExpiring();
    res.json({ message: 'Đã gửi thông báo thẻ sắp hết hạn' });
});

// Gửi thông báo tài liệu đặt giữ đã sẵn sàng
router.get('/auto/reservation-ready', authenticateToken, isLibrarian, async (req, res) => {
    await notificationController.autoNotifyReservationReady();
    res.json({ message: 'Đã gửi thông báo đặt giữ đã sẵn sàng' });
});

module.exports = router;
