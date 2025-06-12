const db = require('../utils/db');

class Renewal {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM renewals");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM renewals WHERE renewal_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Renewal;