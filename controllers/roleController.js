// controllers/roleController.js
const db = require('../utils/db');

// Lấy danh sách tất cả vai trò
exports.getAllRoles = async (req, res) => {
    try {
        const [roles] = await db.query(`SELECT * FROM roles`);
        return res.status(200).json(roles);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Cập nhật vai trò người dùng (chỉ admin, không thay đổi vai trò admin)
exports.updateUserRole = async (req, res) => {
    const { account_id, new_role_id } = req.body;

    if (!account_id || !new_role_id) {
        return res.status(400).json({ message: 'Thiếu account_id hoặc new_role_id' });
    }

    try {
        // Kiểm tra role mới có tồn tại không
        const [[roleCheck]] = await db.query(`SELECT * FROM roles WHERE role_id = ?`, [new_role_id]);
        if (!roleCheck) {
            return res.status(404).json({ message: 'Vai trò mới không tồn tại' });
        }

        // Lấy thông tin người dùng
        const [[account]] = await db.query(`SELECT a.*, r.role_name FROM accounts a JOIN roles r ON a.role_id = r.role_id WHERE a.account_id = ?`, [account_id]);
        if (!account) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        if (account.role_name === 'ADMIN') {
            return res.status(403).json({ message: 'Không thể thay đổi vai trò của tài khoản ADMIN' });
        }

        await db.query(`UPDATE accounts SET role_id = ? WHERE account_id = ?`, [new_role_id, account_id]);
        return res.status(200).json({ message: 'Cập nhật vai trò thành công' });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Tạo mới vai trò (chỉ admin)
exports.createRole = async (req, res) => {
    const { role_name, description } = req.body;
    if (!role_name) return res.status(400).json({ message: 'Thiếu tên vai trò' });

    try {
        const [[existing]] = await db.query(`SELECT * FROM roles WHERE role_name = ?`, [role_name]);
        if (existing) {
            return res.status(409).json({ message: 'Vai trò đã tồn tại' });
        }

        await db.query(`INSERT INTO roles (role_name, description) VALUES (?, ?)`, [role_name, description || null]);
        return res.status(201).json({ message: 'Tạo vai trò thành công' });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};

// Xóa vai trò (chỉ admin, không được xóa vai trò ADMIN hoặc vai trò đang được dùng)
exports.deleteRole = async (req, res) => {
    const { role_id } = req.params;

    try {
        const [[role]] = await db.query(`SELECT * FROM roles WHERE role_id = ?`, [role_id]);
        if (!role) return res.status(404).json({ message: 'Vai trò không tồn tại' });

        if (role.role_name === 'ADMIN') {
            return res.status(403).json({ message: 'Không thể xóa vai trò ADMIN' });
        }

        const [accounts] = await db.query(`SELECT COUNT(*) AS total FROM accounts WHERE role_id = ?`, [role_id]);
        if (accounts[0].total > 0) {
            return res.status(400).json({ message: 'Không thể xóa vai trò đang được sử dụng bởi người dùng' });
        }

        await db.query(`DELETE FROM roles WHERE role_id = ?`, [role_id]);
        return res.status(200).json({ message: 'Xóa vai trò thành công' });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};
