const db = require('../utils/db');

class Publisher {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM publishers");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM publishers WHERE publisher_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Publisher;