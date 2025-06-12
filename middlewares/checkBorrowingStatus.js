const db = require('../utils/db');

const checkBorrowingStatus = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT status FROM borrowings WHERE borrowing_id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Phiếu mượn không tồn tại." });
        if (rows[0].status !== 'BORROWED') return res.status(400).json({ message: "Phiếu mượn không ở trạng thái đang mượn." });
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = checkBorrowingStatus;