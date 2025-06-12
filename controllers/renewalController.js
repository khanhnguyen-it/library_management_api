const db = require('../utils/db');

const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

exports.extendItems = async (req, res) => {
    const { borrowing_id, account_id, items, reason } = req.body;

    if (!borrowing_id || !account_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Thiếu thông tin gia hạn' });
    }

    try {
        const [borrowingRows] = await db.query(`SELECT * FROM borrowings WHERE borrowing_id = ?`, [borrowing_id]);
        if (borrowingRows.length === 0) return res.status(404).json({ message: 'Phiếu mượn không tồn tại' });

        const borrowing = borrowingRows[0];
        if (borrowing.returned_date) {
            return res.status(400).json({ message: 'Phiếu mượn đã được trả' });
        }

        const today = new Date();
        const [borrowingDetails] = await db.query(
            `SELECT * FROM borrowings_detail WHERE borrowing_id = ?`,
            [borrowing_id]
        );

        const detailMap = {};
        borrowingDetails.forEach(d => {
            detailMap[d.document_item_id] = d;
        });

        const rejectedItems = [];
        const updatedDetails = [];
        for (const item of items) {
            const { document_item_id, extend_days, notes } = item;
            const detail = detailMap[document_item_id];

            if (!detail) {
                rejectedItems.push({ document_item_id, reason: 'Tài liệu không nằm trong phiếu mượn' });
                continue;
            }

            const oldDue = new Date(detail.due_date);
            if (today > oldDue) {
                rejectedItems.push({ document_item_id, reason: 'Tài liệu đã quá hạn' });
                continue;
            }

            if (extend_days > 3) {
                rejectedItems.push({ document_item_id, reason: 'Chỉ được gia hạn tối đa 3 ngày' });
                continue;
            }

            // Bỏ kiểm tra renewals_detail vì không còn tồn tại

            const [reserved] = await db.query(
                `SELECT 1 FROM reservation_details rd
                 JOIN reservations r ON r.reservation_id = rd.reservation_id
                 WHERE rd.document_item_id = ? AND r.status = 'WAITING'`,
                [document_item_id]
            );

            if (reserved.length > 0) {
                rejectedItems.push({ document_item_id, reason: 'Tài liệu đã được đặt giữ' });
                continue;
            }

            const newDue = new Date(oldDue);
            newDue.setDate(newDue.getDate() + extend_days);
            updatedDetails.push({ document_item_id, old_due_date: oldDue, new_due_date: newDue, extend_days, notes });
        }

        if (updatedDetails.length === 0) {
            return res.status(400).json({ message: 'Không có tài liệu nào được gia hạn', rejectedItems });
        }

        // Chọn new_due_date chung là ngày trễ nhất
        const latestNewDueDate = updatedDetails.reduce((max, item) => {
            return item.new_due_date > max ? item.new_due_date : max;
        }, updatedDetails[0].new_due_date);

        // Ghi nhận gia hạn vào renewals
        const [result] = await db.query(
            `INSERT INTO renewals (borrowing_id, account_id, renewal_date, new_due_date, status, reason, notes)
             VALUES (?, ?, NOW(), ?, 'APPROVED', ?, ?)`,
            [
                borrowing_id,
                account_id,
                formatDateTime(latestNewDueDate),
                reason || null,
                updatedDetails.map(i => `Tài liệu ${i.document_item_id} +${i.extend_days} ngày`).join('; ')
            ]
        );

        const renewal_id = result.insertId;

        // Cập nhật hạn mới trong borrowings_detail
        for (const item of updatedDetails) {
            const { document_item_id, new_due_date } = item;

            await db.query(
                `UPDATE borrowings_detail SET due_date = ? WHERE borrowing_id = ? AND document_item_id = ?`,
                [formatDateTime(new_due_date), borrowing_id, document_item_id]
            );
        }

        return res.status(201).json({
            message: `Gia hạn thành công cho ${updatedDetails.length} tài liệu`,
            renewal_id,
            updatedDetails,
            rejectedItems
        });
    } catch (err) {
        console.error('Lỗi khi gia hạn:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};
