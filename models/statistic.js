const db = require('../utils/db');

class Statistic {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM statistics");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM statistics WHERE statistic_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Statistic;