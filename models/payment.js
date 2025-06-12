const db = require('../utils/db');

class Payment {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM payments");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM payments WHERE payment_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Payment;