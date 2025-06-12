const checkReturnStatus = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT return_id FROM returns WHERE return_id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Phiếu trả không tồn tại." });
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = checkReturnStatus;