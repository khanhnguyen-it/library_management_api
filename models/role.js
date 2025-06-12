const db = require('../utils/db');

class Role {
    static async getAllRoles() {
        const [rows] = await db.query("SELECT * FROM roles");
        return rows;
    }

    static async findById(role_id) {
        const [rows] = await db.query("SELECT * FROM roles WHERE role_id = ?", [role_id]);
        return rows[0];
    }
}

module.exports = Role;