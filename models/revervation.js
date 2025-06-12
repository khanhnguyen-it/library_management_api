const db = require('../utils/db');

class Reservation {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM reservations");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM reservations WHERE reservation_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Reservation;
