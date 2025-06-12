const db = require('../utils/db');

// Giá mặc định theo loại vi phạm
const VIOLATION_RATES = {
    LATE_PER_DAY: 5000,
    DAMAGE_FLAT: 50000,
    LOST_FLAT: 100000,
    RESERVATION_NO_SHOW: 10000,
    CARD_REPLACEMENT: 20000
};

const formatDateTime = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

exports.createViolation = async (req, res) => {
    const {
        account_id,
        borrowing_id,
        return_id,
        renewal_id,
        description,
        fine_amount,
        notes
    } = req.body;

    if (!account_id || !description) {
        return res.status(400).json({ message: 'Thiếu account_id hoặc description' });
    }

    try {
        let calculatedFine = 0;

        // Tự động tính nếu là vi phạm trả trễ X ngày
        const lateMatch = description.match(/trả trễ (\d+) ngày/i);
        if (lateMatch) {
            const daysLate = parseInt(lateMatch[1], 10);
            calculatedFine = daysLate * VIOLATION_RATES.LATE_PER_DAY;
        } else {
            // Nếu không phải trả trễ thì lấy fine_amount từ client gửi
            if (!fine_amount) {
                return res.status(400).json({ message: 'Phải cung cấp fine_amount cho vi phạm không phải trả trễ' });
            }
            calculatedFine = fine_amount;
        }

        const [violationResult] = await db.query(
            `INSERT INTO violations (account_id, borrowing_id, return_id, renewal_id, description, fine_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [account_id, borrowing_id || null, return_id || null, renewal_id || null, description, calculatedFine, notes || null]
        );

        const violation_id = violationResult.insertId;

        // Tạo payment tương ứng
        const [paymentResult] = await db.query(
            `INSERT INTO payments (account_id, amount, method, status, notes)
       VALUES (?, ?, 'CASH', 'COMPLETED', 'Tự động tạo từ vi phạm')`,
            [account_id, calculatedFine]
        );

        const payment_id = paymentResult.insertId;

        await db.query(
            `INSERT INTO payments_violations (payment_id, violation_id, amount)
       VALUES (?, ?, ?)`,
            [payment_id, violation_id, calculatedFine]
        );

        return res.status(201).json({
            message: 'Ghi nhận vi phạm thành công',
            violation_id,
            payment_id,
            fine_amount: calculatedFine
        });
    } catch (err) {
        console.error('Lỗi khi tạo vi phạm:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getViolationsByAccount = async (req, res) => {
    const { account_id } = req.params;
    try {
        const [rows] = await db.query(`
      SELECT * FROM violations
      WHERE account_id = ?
      ORDER BY violation_date DESC
    `, [account_id]);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách vi phạm:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.updateViolationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PAID', 'WAIVED'].includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    try {
        await db.query(`
      UPDATE violations
      SET status = ?
      WHERE violation_id = ?
    `, [status, id]);
        return res.status(200).json({ message: `Cập nhật trạng thái vi phạm ${id} thành ${status}` });
    } catch (err) {
        console.error('Lỗi cập nhật trạng thái vi phạm:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getViolationById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`
      SELECT * FROM violations WHERE violation_id = ?
    `, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy vi phạm' });
        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Lỗi truy xuất vi phạm:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};
