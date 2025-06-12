const db = require('../utils/db');

class Violation {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM violations");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM violations WHERE violation_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Violation;