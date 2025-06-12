const checkReservationStatus = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT status FROM reservations WHERE reservation_id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Phiếu đặt giữ không tồn tại." });
        if (rows[0].status !== 'ACTIVE') return res.status(400).json({ message: "Phiếu đặt giữ không còn hiệu lực." });
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = checkReservationStatus;