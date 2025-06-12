const db = require('../utils/db');

class User {
    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM accounts WHERE account_id = ?", [id]);
        return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await db.query("SELECT * FROM accounts WHERE username = ?", [username]);
        return rows[0];
    }

    static async getAll() {
        const [rows] = await db.query("SELECT * FROM accounts");
        return rows;
    }
}

module.exports = User;