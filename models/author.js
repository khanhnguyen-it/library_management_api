const db = require('../utils/db');

class Author {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM authors");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM authors WHERE author_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Author;