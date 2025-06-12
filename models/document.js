const db = require('../utils/db');

class Document {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM documents");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM documents WHERE document_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Document;