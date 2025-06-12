const db = require('../utils/db');

class Return {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM returns");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM returns WHERE return_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Return;