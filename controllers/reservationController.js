const db = require('../utils/db');

// Format JS Date to MySQL DATETIME
const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

exports.createReservation = async (req, res) => {
    const { account_id, document_item_id, hold_days = 2, notes } = req.body;

    if (!account_id || !document_item_id) {
        return res.status(400).json({ message: 'Thiếu thông tin account_id hoặc document_item_id' });
    }

    try {
        // 1. Kiểm tra account có thẻ còn hạn
        const [cards] = await db.query(
            `SELECT * FROM cards WHERE account_id = ? AND status = 'ACTIVE' AND expiry_date >= CURDATE()`,
            [account_id]
        );
        if (cards.length === 0) {
            return res.status(403).json({ message: 'Tài khoản không có thẻ hợp lệ hoặc đã hết hạn' });
        }

        // 2. Kiểm tra document_item không còn sẵn sàng
        const [items] = await db.query(
            `SELECT * FROM document_items WHERE document_item_id = ? AND availability_status != 'AVAILABLE'`,
            [document_item_id]
        );
        if (items.length === 0) {
            return res.status(400).json({ message: 'Tài liệu hiện đang sẵn có – không cần đặt giữ' });
        }

        // 3. Kiểm tra account đã đặt giữ tài liệu này chưa
        const [exists] = await db.query(
            `SELECT 1 FROM reservations r
             JOIN reservation_details rd ON r.reservation_id = rd.reservation_id
             WHERE r.account_id = ? AND rd.document_item_id = ? AND r.status = 'ACTIVE'`,
            [account_id, document_item_id]
        );
        if (exists.length > 0) {
            return res.status(409).json({ message: 'Bạn đã đặt giữ tài liệu này trước đó' });
        }

        // 4. Tạo reservation
        const now = new Date();
        const expirationDate = new Date(now.getTime() + hold_days * 24 * 60 * 60 * 1000);
        const [resResult] = await db.query(
            `INSERT INTO reservations (account_id, reservation_date, expiration_date, status, notes)
             VALUES (?, ?, ?, 'ACTIVE', ?)`,
            [account_id, formatDateTime(now), formatDateTime(expirationDate), notes || null]
        );
        const reservation_id = resResult.insertId;

        // 5. Thêm chi tiết
        await db.query(
            `INSERT INTO reservation_details (reservation_id, document_item_id, status)
             VALUES (?, ?, 'RESERVED')`,
            [reservation_id, document_item_id]
        );

        // 6. Ghi nhận thanh toán đặt cọc
        const depositAmount = 10000;

        const [paymentResult] = await db.query(
            `INSERT INTO payments (account_id, reservation_id, amount, method, status, notes)
             VALUES (?, ?, ?, 'CASH', 'COMPLETED', ?)`,
            [account_id, reservation_id, depositAmount, 'Đặt cọc đặt giữ tài liệu']
        );
        return res.status(201).json({
            message: 'Tạo đặt giữ thành công',
            reservation_id,
            document_item_id,
            expiration_date: formatDateTime(expirationDate)
        });

    } catch (err) {
        console.error('Lỗi khi tạo đặt giữ:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.cancelReservation = async (req, res) => {
    const { reservation_id } = req.body;
    if (!reservation_id) {
        return res.status(400).json({ message: 'Thiếu reservation_id' });
    }
    try {
        await db.query(`UPDATE reservations SET status = 'CANCELLED' WHERE reservation_id = ?`, [reservation_id]);
        await db.query(`UPDATE reservation_details SET status = 'CANCELLED' WHERE reservation_id = ?`, [reservation_id]);
        return res.status(200).json({ message: 'Hủy đặt giữ thành công' });
    } catch (err) {
        console.error('Lỗi khi hủy đặt giữ:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.notifyNextUser = async (req, res) => {
    const { document_item_id } = req.body;
    if (!document_item_id) return res.status(400).json({ message: 'Thiếu document_item_id' });

    try {
        const [rows] = await db.query(
            `SELECT rd.*, r.account_id, r.reservation_id FROM reservation_details rd
             JOIN reservations r ON r.reservation_id = rd.reservation_id
             WHERE rd.document_item_id = ? AND rd.status = 'RESERVED' AND r.status = 'ACTIVE'
             ORDER BY r.reservation_date ASC LIMIT 1`,
            [document_item_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không có ai đặt giữ tài liệu này' });
        }

        const nextUser = rows[0];
        const holdUntil = new Date();
        holdUntil.setDate(holdUntil.getDate() + 2);

        await db.query(
            `UPDATE reservation_details SET status = 'AVAILABLE'
             WHERE reservation_id = ? AND document_item_id = ?`,
            [nextUser.reservation_id, document_item_id]
        );
        await db.query(
            `UPDATE reservations SET status = 'READY', expiration_date = ?
             WHERE reservation_id = ?`,
            [formatDateTime(holdUntil), nextUser.reservation_id]
        );

        return res.status(200).json({
            message: 'Đã đến lượt bạn đọc. Đánh dấu giữ trong 2 ngày.',
            account_id: nextUser.account_id,
            reservation_id: nextUser.reservation_id,
            hold_until: formatDateTime(holdUntil)
        });
    } catch (err) {
        console.error('Lỗi khi đến lượt:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getReservationsByDocumentItem = async (req, res) => {
    const { document_item_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT r.reservation_id, r.account_id, r.status, r.reservation_date, r.expiration_date,
                    rd.status AS detail_status
             FROM reservations r
             JOIN reservation_details rd ON r.reservation_id = rd.reservation_id
             WHERE rd.document_item_id = ?
             ORDER BY r.reservation_date ASC`,
            [document_item_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi xem danh sách đặt:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.autoExpireReservations = async (req, res) => {
    try {
        const [expiredList] = await db.query(
            `SELECT r.reservation_id, rd.document_item_id
             FROM reservations r
             JOIN reservation_details rd ON r.reservation_id = rd.reservation_id
             WHERE r.status = 'READY' AND r.expiration_date < NOW() AND rd.status = 'AVAILABLE'`
        );

        if (expiredList.length === 0) {
            return res.status(200).json({ message: 'Không có phiếu đặt giữ nào hết hạn' });
        }

        const expiredIds = new Set();
        for (const item of expiredList) {
            expiredIds.add(item.reservation_id);
            await db.query(
                `UPDATE reservation_details SET status = 'EXPIRED'
                 WHERE reservation_id = ? AND document_item_id = ?`,
                [item.reservation_id, item.document_item_id]
            );
        }

        for (const id of expiredIds) {
            await db.query(
                `UPDATE reservations SET status = 'EXPIRED'
                 WHERE reservation_id = ?`,
                [id]
            );
        }

        return res.status(200).json({
            message: `Đã xử lý ${expiredIds.size} phiếu đặt giữ quá hạn.`,
            expired_reservations: Array.from(expiredIds)
        });

    } catch (err) {
        console.error('Lỗi autoExpireReservations:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Lấy tất cả reservation (có thể mở rộng thêm filter sau này)
exports.getAllReservations = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, rd.document_item_id, rd.status AS detail_status
             FROM reservations r
             JOIN reservation_details rd ON r.reservation_id = rd.reservation_id
             ORDER BY r.reservation_date DESC`
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi getAllReservations:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Lấy reservation theo ID
exports.getReservationById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT r.*, rd.document_item_id, rd.status AS detail_status
             FROM reservations r
             JOIN reservation_details rd ON r.reservation_id = rd.reservation_id
             WHERE r.reservation_id = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phiếu đặt giữ' });
        }
        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Lỗi getReservationById:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Lấy danh sách đặt giữ theo account_id
exports.getReservationsByAccount = async (req, res) => {
    const { account_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT r.*, rd.document_item_id, rd.status AS detail_status
             FROM reservations r
             JOIN reservation_details rd ON r.reservation_id = rd.reservation_id
             WHERE r.account_id = ?
             ORDER BY r.reservation_date DESC`,
            [account_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi getReservationsByAccount:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};
