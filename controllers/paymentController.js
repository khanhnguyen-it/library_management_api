const db = require('../utils/db');

// Lấy payments theo account_id
exports.getPaymentsByAccount = async (req, res) => {
    const { account_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT * FROM payments WHERE account_id = ? ORDER BY payment_date DESC`,
            [account_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy payments theo account:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Lấy payments theo violation_id
exports.getPaymentsByViolation = async (req, res) => {
    const { violation_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT p.* FROM payments p
             JOIN payments_violations pv ON p.payment_id = pv.payment_id
             WHERE pv.violation_id = ?`,
            [violation_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy payments theo violation:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Lấy payments theo borrowing_id
exports.getPaymentsByBorrowing = async (req, res) => {
    const { borrowing_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT p.* FROM payments p
             JOIN payments_borrowings pb ON p.payment_id = pb.payment_id
             WHERE pb.borrowing_id = ?`,
            [borrowing_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy payments theo borrowing:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Xác nhận thanh toán
exports.confirmPayment = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            `UPDATE payments SET status = 'COMPLETED' WHERE payment_id = ?`,
            [id]
        );
        return res.status(200).json({ message: 'Xác nhận thanh toán thành công' });
    } catch (err) {
        console.error('Lỗi khi xác nhận thanh toán:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Tạo thanh toán thủ công
exports.createManualPayment = async (req, res) => {
    const {
        account_id,
        amount,
        method = 'CASH',
        notes,
        borrowing_id,
        return_id,
        renewal_id,
        violation_id,
        reservation_id,
        card_id
    } = req.body;

    if (!account_id || !amount) {
        return res.status(400).json({ message: 'Thiếu account_id hoặc amount' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO payments (account_id, card_id, reservation_id, amount, method, status, notes)
             VALUES (?, ?, ?, ?, ?, 'COMPLETED', ?)`,
            [account_id, card_id || null, reservation_id || null, amount, method, notes || 'Tạo thủ công']
        );
        const payment_id = result.insertId;

        if (borrowing_id) {
            await db.query(`INSERT INTO payments_borrowings (payment_id, borrowing_id) VALUES (?, ?)`, [payment_id, borrowing_id]);
        }
        if (return_id) {
            await db.query(`INSERT INTO payments_returns (payment_id, return_id) VALUES (?, ?)`, [payment_id, return_id]);
        }
        if (renewal_id) {
            await db.query(`INSERT INTO payments_renewals (payment_id, renewal_id) VALUES (?, ?)`, [payment_id, renewal_id]);
        }
        if (violation_id) {
            await db.query(`INSERT INTO payments_violations (payment_id, violation_id, amount) VALUES (?, ?, ?)`, [payment_id, violation_id, amount]);
        }

        return res.status(201).json({ message: 'Tạo thanh toán thủ công thành công', payment_id });
    } catch (err) {
        console.error('Lỗi khi tạo payment thủ công:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Hoàn cọc cho tài liệu trả đúng hạn
exports.refundDeposit = async (req, res) => {
    const { borrowing_id, document_item_id } = req.body;

    try {
        const [rows] = await db.query(`
            SELECT bd.*, b.account_id
            FROM borrowings_detail bd
            JOIN borrowings b ON b.borrowing_id = bd.borrowing_id
            WHERE bd.borrowing_id = ? AND bd.document_item_id = ?`,
            [borrowing_id, document_item_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin chi tiết mượn' });
        }

        const detail = rows[0];

        if (detail.condition_status !== 'GOOD') {
            return res.status(400).json({ message: 'Tài liệu có vi phạm, không hoàn cọc' });
        }

        const refundAmount = 10000; // cọc cố định ví dụ 10.000đ

        await db.query(`
            INSERT INTO payments (account_id, amount, method, status, notes)
            VALUES (?, ?, 'CASH', 'COMPLETED', ?)`,
            [detail.account_id, -refundAmount, `Hoàn cọc cho tài liệu ID ${document_item_id}`]
        );

        return res.status(200).json({ message: 'Hoàn cọc thành công' });
    } catch (err) {
        console.error('Lỗi hoàn cọc:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Xử lý đặt giữ quá hạn và ghi nhận vi phạm
exports.handleExpiredReservation = async (req, res) => {
    const { reservation_id, document_item_id } = req.body;

    try {
        const [rows] = await db.query(`
            SELECT r.account_id, rd.status
            FROM reservations r
            JOIN reservation_details rd ON r.reservation_id = rd.reservation_id
            WHERE r.reservation_id = ? AND rd.document_item_id = ?`,
            [reservation_id, document_item_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy chi tiết đặt giữ' });
        }

        const record = rows[0];

        if (record.status !== 'RESERVED') {
            return res.status(400).json({ message: 'Tài liệu không còn trạng thái đặt giữ' });
        }

        // 1. Cập nhật reservation_detail → EXPIRED
        await db.query(`
            UPDATE reservation_details
            SET status = 'EXPIRED'
            WHERE reservation_id = ? AND document_item_id = ?`,
            [reservation_id, document_item_id]
        );

        // 2. Ghi nhận thanh toán phạt (mất cọc)
        const fineAmount = 10000;

        const [paymentResult] = await db.query(`
            INSERT INTO payments (account_id, reservation_id, amount, method, status, notes)
            VALUES (?, ?, ?, 'CASH', 'COMPLETED', ?)`,
            [record.account_id, reservation_id, fineAmount, 'Không đến nhận sách đúng hạn – mất cọc']
        );
        const payment_id = paymentResult.insertId;

        // 3. Tạo vi phạm
        const [violationResult] = await db.query(`
            INSERT INTO violations (account_id, violation_date, description, fine_amount, status, notes)
            VALUES (?, NOW(), ?, ?, 'PENDING', ?)`,
            [
                record.account_id,
                'Không đến nhận tài liệu đã đặt giữ',
                fineAmount,
                'Hệ thống tự động ghi nhận'
            ]
        );
        const violation_id = violationResult.insertId;

        // 4. Gắn payment ↔ violation
        await db.query(`
            INSERT INTO payments_violations (payment_id, violation_id, amount)
            VALUES (?, ?, ?)`,
            [payment_id, violation_id, fineAmount]
        );

        return res.status(200).json({
            message: 'Đã xử lý đặt giữ quá hạn và ghi nhận vi phạm',
            payment_id,
            violation_id
        });
    } catch (err) {
        console.error('Lỗi xử lý đặt giữ quá hạn:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};
