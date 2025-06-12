const db = require('../utils/db');

// Format JS Date → MySQL DATETIME
const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

exports.createReturn = async (req, res) => {
    const { borrowing_id, document_items, processed_by, notes } = req.body;

    if (!borrowing_id || !Array.isArray(document_items) || document_items.length === 0) {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    try {
        // 1. Kiểm tra phiếu mượn tồn tại
        const [borrowings] = await db.query(`SELECT * FROM borrowings WHERE borrowing_id = ?`, [borrowing_id]);
        if (borrowings.length === 0) return res.status(404).json({ message: 'Phiếu mượn không tồn tại' });

        const borrowing = borrowings[0];

        // 2. Tính số ngày trễ
        const today = new Date();
        const dueDate = new Date(borrowing.due_date);
        const lateDays = Math.max(Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)), 0);

        // 3. Tính tổng tiền phạt và trạng thái
        let totalFine = 0;
        let returnStatus = 'ON_TIME';

        for (const item of document_items) {
            if (item.status === 'DAMAGED' || item.status === 'LOST') {
                totalFine += 50000; // giả định phạt hư/mất là 50k/tài liệu
                returnStatus = item.status;
            }
        }

        if (lateDays > 0) {
            totalFine += lateDays * 5000; // giả định phạt trễ 5k/ngày
            if (returnStatus === 'ON_TIME') returnStatus = 'LATE';
        }

        // 4. Tạo phiếu trả
        const returnDate = formatDateTime(today);
        const [result] = await db.query(
            `INSERT INTO returns (borrowing_id, return_date, late_days, fine_amount, status, processed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [borrowing_id, returnDate, lateDays, totalFine, returnStatus, processed_by, notes]
        );
        const return_id = result.insertId;

        // 5. Ghi vào returns_detail và cập nhật bản sao
        for (const item of document_items) {
            await db.query(
                `INSERT INTO returns_detail 
        (return_id, document_item_id, status, actual_return_date, damage_reason) 
         VALUES (?, ?, ?, ?, ?)`,
                [return_id, item.document_item_id, item.status, returnDate, item.damage_reason || null]
            );

            // Trả lại tài liệu về trạng thái AVAILABLE (nếu không mất)
            if (item.status !== 'LOST') {
                await db.query(
                    `UPDATE document_items SET availability_status = 'AVAILABLE' WHERE document_item_id = ?`,
                    [item.document_item_id]
                );
            }
        }

        // 🔁 HOÀN CỌC nếu trả đúng và không vi phạm
        for (const item of document_items) {
            if (item.status === 'GOOD') {
                const refundAmount = -10000; // hoàn cọc là số âm

                const [paymentResult] = await db.query(
                    `INSERT INTO payments (account_id, amount, method, status, notes)
             VALUES (?, ?, 'CASH', 'COMPLETED', ?)`,
                    [borrowing.account_id, refundAmount, `Hoàn cọc tài liệu ID ${item.document_item_id}`]
                );

                const payment_id = paymentResult.insertId;

                await db.query(
                    `INSERT INTO payments_returns (payment_id, return_id, notes)
             VALUES (?, ?, ?)`,
                    [payment_id, return_id, `Hoàn cọc khi trả tài liệu ID ${item.document_item_id}`]
                );
            }
        }


        // 6. Cập nhật phiếu mượn thành "RETURNED"
        await db.query(
            `UPDATE borrowings SET status = 'RETURNED', returned_date = ? WHERE borrowing_id = ?`,
            [returnDate, borrowing_id]
        );

        // 7. Nếu có vi phạm → ghi nhận
        if (totalFine > 0) {
            await db.query(
                `INSERT INTO violations (account_id, borrowing_id, violation_date, description, fine_amount, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
                [borrowing.account_id, borrowing_id, returnDate, 'Vi phạm khi trả tài liệu', totalFine]
            );
        }

        return res.status(201).json({
            message: 'Trả tài liệu thành công',
            return_id,
            late_days: lateDays,
            fine_amount: totalFine,
            status: returnStatus
        });

    } catch (err) {
        console.error('Lỗi khi xử lý trả tài liệu:', err);
        return res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getAllReturns = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM returns ORDER BY return_date DESC`);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách phiếu trả:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getReturnById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`SELECT * FROM returns WHERE return_id = ?`, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu trả' });
        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Lỗi khi lấy phiếu trả theo ID:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getReturnsByAccount = async (req, res) => {
    const { account_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT r.* FROM returns r
             JOIN borrowings b ON r.borrowing_id = b.borrowing_id
             WHERE b.account_id = ?
             ORDER BY r.return_date DESC`,
            [account_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách phiếu trả theo account:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};
