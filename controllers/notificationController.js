const db = require('../utils/db');

const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

exports.createManualNotification = async (req, res) => {
    const {
        title,
        content,
        account_ids = [],
        send_to_all = false,
        borrowing_id,
        return_id,
        payment_id,
        renewal_id,
        reservation_id,
        notes
    } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Thiếu tiêu đề hoặc nội dung' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO notifications (title, content, sent_at, borrowing_id, return_id, payment_id, renewal_id, reservation_id, send_to_all, notes)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
            [title, content, borrowing_id || null, return_id || null, payment_id || null, renewal_id || null, reservation_id || null, send_to_all, notes || null]
        );

        const notification_id = result.insertId;

        if (send_to_all) {
            const [accounts] = await db.query(`SELECT account_id FROM accounts WHERE status = 'ACTIVE'`);
            for (const acc of accounts) {
                await db.query(`INSERT INTO notifications_detail (notification_id, account_id) VALUES (?, ?)`, [notification_id, acc.account_id]);
            }
        } else {
            for (const accId of account_ids) {
                await db.query(`INSERT INTO notifications_detail (notification_id, account_id) VALUES (?, ?)`, [notification_id, accId]);
            }
        }

        return res.status(201).json({ message: 'Tạo thông báo thành công', notification_id });
    } catch (err) {
        console.error('Lỗi tạo thông báo:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getNotificationsByAccount = async (req, res) => {
    const { account_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT n.notification_id, n.title, n.content, n.sent_at, nd.status
       FROM notifications_detail nd
       JOIN notifications n ON n.notification_id = nd.notification_id
       WHERE nd.account_id = ?
       ORDER BY n.sent_at DESC`,
            [account_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy thông báo:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    const { account_id, notification_id } = req.body;
    try {
        await db.query(
            `UPDATE notifications_detail SET status = 'READ' WHERE account_id = ? AND notification_id = ?`,
            [account_id, notification_id]
        );
        return res.status(200).json({ message: 'Đã đánh dấu đã đọc' });
    } catch (err) {
        console.error('Lỗi cập nhật trạng thái:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    const { account_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT COUNT(*) AS unread FROM notifications_detail WHERE account_id = ? AND status = 'UNREAD'`,
            [account_id]
        );
        return res.status(200).json({ unread: rows[0].unread });
    } catch (err) {
        console.error('Lỗi đếm thông báo:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// -------- TỰ ĐỘNG GỬI THÔNG BÁO -------- //

exports.autoNotifyOverdueBorrows = async () => {
    try {
        const [overdueBorrows] = await db.query(
            `SELECT borrowing_id, account_id FROM borrowings
       WHERE status = 'BORROWED' AND due_date < CURDATE()`
        );

        for (const borrow of overdueBorrows) {
            const title = 'Thông báo quá hạn mượn tài liệu';
            const content = `Bạn đang có tài liệu quá hạn (phiếu mượn #${borrow.borrowing_id}). Vui lòng trả sớm nhất có thể.`;
            const [result] = await db.query(
                `INSERT INTO notifications (title, content, sent_at, borrowing_id) VALUES (?, ?, NOW(), ?)`,
                [title, content, borrow.borrowing_id]
            );
            const notifyId = result.insertId;
            await db.query(`INSERT INTO notifications_detail (notification_id, account_id) VALUES (?, ?)`, [notifyId, borrow.account_id]);
        }
    } catch (err) {
        console.error('Lỗi gửi thông báo quá hạn:', err);
    }
};

exports.autoNotifyDueSoonBorrows = async () => {
    try {
        const [dueSoon] = await db.query(
            `SELECT borrowing_id, account_id, due_date FROM borrowings
       WHERE status = 'BORROWED' AND DATEDIFF(due_date, CURDATE()) = 1`
        );

        for (const b of dueSoon) {
            const title = 'Nhắc nhở trả tài liệu sắp đến hạn';
            const content = `Bạn có tài liệu cần trả vào ngày mai (phiếu mượn #${b.borrowing_id}). Vui lòng kiểm tra và chuẩn bị trả.`;
            const [result] = await db.query(
                `INSERT INTO notifications (title, content, sent_at, borrowing_id) VALUES (?, ?, NOW(), ?)`,
                [title, content, b.borrowing_id]
            );
            const notifyId = result.insertId;
            await db.query(`INSERT INTO notifications_detail (notification_id, account_id) VALUES (?, ?)`, [notifyId, b.account_id]);
        }
    } catch (err) {
        console.error('Lỗi gửi thông báo nhắc nhở sắp hết hạn:', err);
    }
};

exports.autoNotifyUnpaidViolations = async () => {
    try {
        const [violations] = await db.query(
            `SELECT violation_id, account_id, fine_amount FROM violations WHERE status = 'PENDING'`
        );
        for (const v of violations) {
            const title = 'Thông báo vi phạm chưa xử lý';
            const content = `Bạn đang có vi phạm với số tiền ${v.fine_amount.toLocaleString()} VNĐ chưa thanh toán. Vui lòng đến thư viện để xử lý.`;
            const [result] = await db.query(
                `INSERT INTO notifications (title, content, sent_at) VALUES (?, ?, NOW())`,
                [title, content]
            );
            const notifyId = result.insertId;
            await db.query(`INSERT INTO notifications_detail (notification_id, account_id) VALUES (?, ?)`, [notifyId, v.account_id]);
        }
    } catch (err) {
        console.error('Lỗi gửi thông báo vi phạm:', err);
    }
};

exports.autoNotifyCardExpiring = async () => {
    try {
        const [cards] = await db.query(
            `SELECT c.card_id, c.account_id, c.expiry_date FROM cards c
       WHERE c.status = 'ACTIVE' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)`
        );
        for (const card of cards) {
            const title = 'Thẻ thư viện sắp hết hạn';
            const content = `Thẻ thư viện của bạn sẽ hết hạn vào ngày ${card.expiry_date.toISOString().split('T')[0]}. Vui lòng gia hạn để tiếp tục sử dụng.`;
            const [result] = await db.query(
                `INSERT INTO notifications (title, content, sent_at) VALUES (?, ?, NOW())`,
                [title, content]
            );
            const notifyId = result.insertId;
            await db.query(`INSERT INTO notifications_detail (notification_id, account_id) VALUES (?, ?)`, [notifyId, card.account_id]);
        }
    } catch (err) {
        console.error('Lỗi gửi thông báo thẻ hết hạn:', err);
    }
};

exports.autoNotifyReservationReady = async () => {
    try {
        const [ready] = await db.query(
            `SELECT r.reservation_id, r.account_id, rd.document_item_id FROM reservations r
       JOIN reservation_details rd ON r.reservation_id = rd.reservation_id
       WHERE r.status = 'READY' AND rd.status = 'AVAILABLE'`
        );
        for (const r of ready) {
            const title = 'Tài liệu đặt giữ đã sẵn sàng';
            const content = `Tài liệu bạn đặt giữ (ID: ${r.document_item_id}) đã sẵn sàng. Vui lòng đến nhận trong thời gian giữ.`;
            const [result] = await db.query(
                `INSERT INTO notifications (title, content, sent_at, reservation_id) VALUES (?, ?, NOW(), ?)`,
                [title, content, r.reservation_id]
            );
            const notifyId = result.insertId;
            await db.query(`INSERT INTO notifications_detail (notification_id, account_id) VALUES (?, ?)`, [notifyId, r.account_id]);
        }
    } catch (err) {
        console.error('Lỗi gửi thông báo đặt giữ:', err);
    }
};
