const db = require('../utils/db');

class Category {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM categories");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM categories WHERE category_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Category;