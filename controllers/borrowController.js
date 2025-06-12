const db = require('../utils/db');

// Hàm định dạng ngày
const formatDate = (date) => date.toISOString().slice(0, 10);

exports.createBorrow = async (req, res) => {
    const { account_id, document_item_id, borrow_method = 'DIRECT' } = req.body;

    if (!account_id || !Array.isArray(document_item_id) || document_item_id.length === 0) {
        return res.status(400).json({ message: 'Thiếu thông tin mượn tài liệu' });
    }

    try {
        const [cards] = await db.query(
            `SELECT * FROM cards WHERE account_id = ? AND status = 'ACTIVE' AND expiry_date >= CURDATE()`,
            [account_id]
        );
        if (cards.length === 0) {
            return res.status(403).json({ message: 'Thẻ thư viện đã hết hạn hoặc bị khóa' });
        }

        const [violations] = await db.query(
            `SELECT * FROM violations WHERE account_id = ? AND status = 'PENDING'`,
            [account_id]
        );
        if (violations.length > 0) {
            return res.status(403).json({ message: 'Bạn đang có vi phạm chưa xử lý' });
        }

        const [borrowed] = await db.query(
            `SELECT COUNT(*) AS total FROM borrowings b
             JOIN borrowings_detail bd ON b.borrowing_id = bd.borrowing_id
             WHERE b.account_id = ? AND b.status = 'BORROWED'`,
            [account_id]
        );
        if (borrowed[0].total + document_item_id.length > 5) {
            return res.status(403).json({ message: 'Bạn đã đạt số lượng mượn tối đa (5)' });
        }

        const unavailable = [];
        for (const item_id of document_item_id) {
            const [rows] = await db.query(
                `SELECT * FROM document_items WHERE document_item_id = ? AND availability_status = 'AVAILABLE'`,
                [item_id]
            );
            if (rows.length === 0) unavailable.push(item_id);
        }
        if (unavailable.length > 0) {
            return res.status(400).json({ message: 'Một số tài liệu không khả dụng', unavailable });
        }

        const today = new Date();
        const borrowing_date = today.toISOString().slice(0, 19).replace('T', ' ');
        const due_date = new Date();
        const DEFAULT_DUE_DAYS = 7;
        due_date.setDate(today.getDate() + DEFAULT_DUE_DAYS);
        const due_date_str = due_date.toISOString().slice(0, 19).replace('T', ' ');

        const [insert] = await db.query(
            `INSERT INTO borrowings (account_id, borrowing_date, due_date, status, borrow_method, document_count)
             VALUES (?, ?, ?, 'BORROWED', ?, ?)`,
            [account_id, borrowing_date, due_date_str, borrow_method, document_item_id.length]
        );
        const borrowing_id = insert.insertId;

        for (const item_id of document_item_id) {
            const item_due = new Date();
            item_due.setDate(today.getDate() + DEFAULT_DUE_DAYS);

            await db.query(
                `INSERT INTO borrowings_detail (borrowing_id, document_item_id, due_date)
                 VALUES (?, ?, ?)`,
                [borrowing_id, item_id, item_due]
            );

            await db.query(
                `UPDATE document_items SET availability_status = 'BORROWED' WHERE document_item_id = ?`,
                [item_id]
            );
        }

        const depositPerItem = 10000;
        const totalDeposit = depositPerItem * document_item_id.length;

        const [paymentResult] = await db.query(
            `INSERT INTO payments (account_id, amount, method, status, notes)
             VALUES (?, ?, 'CASH', 'COMPLETED', ?)`,
            [account_id, totalDeposit, `Cọc mượn ${document_item_id.length} tài liệu`]
        );
        const payment_id = paymentResult.insertId;

        await db.query(
            `INSERT INTO payments_borrowings (payment_id, borrowing_id, notes)
             VALUES (?, ?, ?)`,
            [payment_id, borrowing_id, 'Thanh toán cọc khi mượn tài liệu']
        );

        return res.status(201).json({
            message: 'Tạo phiếu mượn thành công',
            borrowing_id,
            borrowed_items: document_item_id.length
        });

    } catch (err) {
        console.error('Lỗi tạo phiếu mượn:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getAllBorrows = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM borrowings ORDER BY borrowing_date DESC`);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách borrowings:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getBorrowById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`SELECT * FROM borrowings WHERE borrowing_id = ?`, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Lỗi khi lấy phiếu mượn:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getBorrowsByAccount = async (req, res) => {
    const { account_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT * FROM borrowings WHERE account_id = ? ORDER BY borrowing_date DESC`,
            [account_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy phiếu mượn theo account:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getOverdueBorrows = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM borrowings WHERE status = 'BORROWED' AND due_date < NOW()`
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách borrowings quá hạn:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};
