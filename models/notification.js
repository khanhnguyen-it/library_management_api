const db = require('../utils/db');

class Notification {
    static async getAll() {
        const [rows] = await db.query("SELECT * FROM notifications");
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM notifications WHERE notification_id = ?", [id]);
        return rows[0];
    }
}

module.exports = Notification;