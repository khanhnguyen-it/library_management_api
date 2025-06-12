const db = require('../utils/db');

// Format JS Date to MySQL DATETIME
const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

exports.generateStatistic = async (req, res) => {
    const { start_date, end_date, created_by_id } = req.body;
    if (!start_date || !end_date || !created_by_id) {
        return res.status(400).json({ message: 'Thiếu thông tin thống kê' });
    }

    try {
        const [borrowingCount] = await db.query(
            `SELECT COUNT(*) AS total FROM borrowings WHERE borrowing_date BETWEEN ? AND ?`,
            [start_date, end_date]
        );

        const [returnCount] = await db.query(
            `SELECT COUNT(*) AS total FROM returns WHERE return_date BETWEEN ? AND ?`,
            [start_date, end_date]
        );

        const [violationCount] = await db.query(
            `SELECT COUNT(*) AS total FROM violations WHERE violation_date BETWEEN ? AND ?`,
            [start_date, end_date]
        );

        const [paymentTotal] = await db.query(
            `SELECT SUM(amount) AS total FROM payments WHERE payment_date BETWEEN ? AND ?`,
            [start_date, end_date]
        );

        const [insertResult] = await db.query(
            `INSERT INTO statistics (created_by_id, start_date, end_date, total_borrowings, total_returns, total_violations, total_payments)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                created_by_id,
                start_date,
                end_date,
                borrowingCount[0].total || 0,
                returnCount[0].total || 0,
                violationCount[0].total || 0,
                paymentTotal[0].total || 0.0,
            ]
        );

        return res.status(201).json({
            message: 'Tạo thống kê thành công',
            statistic_id: insertResult.insertId,
        });
    } catch (err) {
        console.error('Lỗi khi tạo thống kê:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getDocumentStatus = async (req, res) => {
    try {
        const [statusCounts] = await db.query(
            `SELECT availability_status, COUNT(*) AS total
             FROM document_items
             GROUP BY availability_status`
        );
        return res.status(200).json(statusCounts);
    } catch (err) {
        console.error('Lỗi khi thống kê tài liệu:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getBorrowingSummary = async (req, res) => {
    try {
        const [summary] = await db.query(
            `SELECT DATE(borrowing_date) AS date, COUNT(*) AS total
             FROM borrowings
             GROUP BY DATE(borrowing_date)
             ORDER BY DATE(borrowing_date)`
        );
        return res.status(200).json(summary);
    } catch (err) {
        console.error('Lỗi khi lấy thống kê mượn:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getTopBorrowedDocuments = async (req, res) => {
    try {
        const [topDocs] = await db.query(
            `SELECT d.document_id, d.document_title, COUNT(bd.document_item_id) AS borrow_count
             FROM borrowings_detail bd
             JOIN document_items di ON bd.document_item_id = di.document_item_id
             JOIN documents d ON di.document_id = d.document_id
             GROUP BY d.document_id, d.document_title
             ORDER BY borrow_count DESC
             LIMIT 10`
        );
        return res.status(200).json(topDocs);
    } catch (err) {
        console.error('Lỗi khi lấy top tài liệu:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

exports.getViolationStats = async (req, res) => {
    try {
        const [violationStats] = await db.query(
            `SELECT DATE(violation_date) AS date, COUNT(*) AS total
             FROM violations
             GROUP BY DATE(violation_date)
             ORDER BY DATE(violation_date)`
        );
        return res.status(200).json(violationStats);
    } catch (err) {
        console.error('Lỗi khi lấy thống kê vi phạm:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};
