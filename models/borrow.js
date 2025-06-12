const db = require('../utils/db');

class Borrow {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM borrowings");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM borrowings WHERE borrowing_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Borrow;