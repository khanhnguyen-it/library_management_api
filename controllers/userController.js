const db = require('../utils/db');
const bcrypt = require('bcryptjs');

// Sinh mã độc giả duy nhất: DG000001
const generateReaderCode = async () => {
    const prefix = 'DG';
    const [rows] = await db.query('SELECT MAX(account_id) AS max_id FROM accounts');
    const nextId = (rows[0].max_id || 0) + 1;
    return prefix + String(nextId).padStart(6, '0');
};

// Tạo tài khoản độc giả
const createUser = async (req, res) => {
    const {
        username, password, full_name, email, phone_number, cccd, gender,
        date_of_birth, address, member_type, institution_name, notes
    } = req.body;

    // 1. Chỉ Admin hoặc Thủ thư mới được phép tạo
    const creatorRole = req.user.role_id;
    if (creatorRole !== 1 && creatorRole !== 2) {
        return res.status(403).json({ message: 'Bạn không có quyền thực hiện chức năng này!' });
    }

    // 2. Kiểm tra trùng username
    const [existing] = await db.query('SELECT * FROM accounts WHERE username = ?', [username]);
    if (existing.length > 0) {
        return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const reader_code = await generateReaderCode();

        // 3. Insert dữ liệu
        await db.query(`
      INSERT INTO accounts (
        username, password, full_name, email, phone_number, cccd,
        gender, date_of_birth, address, member_type, institution_name,
        role_id, reader_code, status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, ?, 'ACTIVE', ?)`,
            [    username, hashedPassword, full_name, email, phone_number,
            cccd || null, gender || null, date_of_birth || null, address || null,
            member_type || 'MEMBER', institution_name || null, reader_code, notes || null
        ]);

        return res.status(201).json({
            message: 'Tạo tài khoản thành công!',
            reader_code
        });
    } catch (err) {
        console.error('Lỗi khi tạo tài khoản:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};



// Lấy thông tin người dùng
const getUserInfo = async (req, res) => {
    const userId = req.user.account_id;

    try {
        const [user] = await db.query("SELECT account_id, username, full_name, email, phone_number, role_id FROM accounts WHERE account_id = ?", [userId]);
        if (user.length > 0) {
            res.status(200).json(user[0]);
        } else {
            res.status(404).json({ message: "Người dùng không tồn tại!" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Người dùng tự cập nhật thông tin
const updateUserSelf = async (req, res) => {
    const account_id = req.user.account_id;
    if (!account_id || isNaN(account_id)) {
        return res.status(400).json({ message: "Không xác định được người dùng đăng nhập!" });
    }

    const allowedFields = ["email", "phone_number", "address"];
    const disallowedFields = ["full_name", "gender", "date_of_birth", "cccd", "member_type", "institution_name", "notes", "status", "username", "role_id"];

    const fieldsToUpdate = [];
    const values = [];

    // Chặn nếu có field không được quyền cập nhật
    for (const field of disallowedFields) {
        if (req.body.hasOwnProperty(field)) {
            return res.status(403).json({ message: "Có thông tin bạn không có quyền sửa!" });
        }
    }

    // Chỉ xử lý các trường hợp hợp lệ (bao gồm cả chuỗi rỗng => không cập nhật)
    allowedFields.forEach(field => {
        if (req.body.hasOwnProperty(field) && req.body[field] !== "") {
            fieldsToUpdate.push(`${field} = ?`);
            values.push(req.body[field]);
        }
    });

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: "Không có trường nào được phép cập nhật!" });
    }

    fieldsToUpdate.push("updated_at = CURRENT_TIMESTAMP");
    values.push(account_id);

    const sql = `UPDATE accounts SET ${fieldsToUpdate.join(", ")} WHERE account_id = ?`;
    await db.query(sql, values);

    return res.status(200).json({ message: "Cập nhật thông tin thành công!" });
};


//Admin/Thủ thư sửa thông tin cá nhân của độc giả
const updateUserByAdmin = async (req, res) => {
    const currentUser = req.user;
    const targetId = parseInt(req.params.id);

    const {
        full_name, email, phone_number, gender, date_of_birth,
        address, member_type, institution_name, cccd,
        status, notes, role_id
    } = req.body;

    const [rows] = await db.query("SELECT * FROM accounts WHERE account_id = ?", [targetId]);
    if (rows.length === 0) {
        return res.status(404).json({ message: "Tài khoản không tồn tại!" });
    }
    const targetUser = rows[0];

    // Thủ thư không được chỉnh sửa admin
    if (currentUser.role_id === 2 && targetUser.role_id === 1) {
        return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa thông tin tài khoản này!" });
    }

    // Thủ thư chỉ sửa Member
    if (currentUser.role_id === 2 && targetUser.role_id !== 3) {
        return res.status(403).json({ message: "Thủ thư chỉ được phép chỉnh sửa tài khoản Member!" });
    }

    // Thủ thư không được sửa role_id
    if (currentUser.role_id === 2 && role_id && role_id !== targetUser.role_id) {
        return res.status(403).json({ message: "Thủ thư không có quyền thay đổi vai trò người dùng!" });
    }

    const updates = [];
    const values = [];

    const allFields = {
        full_name, email, phone_number, gender, date_of_birth,
        address, member_type, institution_name, cccd, status, notes
    };

    for (const [key, value] of Object.entries(allFields)) {
        if (req.body.hasOwnProperty(key) && value !== "") {
            updates.push(`${key} = ?`);
            values.push(value);
        }
    }

    if (currentUser.role_id === 1 && role_id && role_id !== targetUser.role_id) {
        updates.push("role_id = ?");
        values.push(role_id);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: "Không có trường nào được cập nhật!" });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(targetId);

    const sql = `UPDATE accounts SET ${updates.join(", ")} WHERE account_id = ?`;
    await db.query(sql, values);

    return res.status(200).json({ message: "Cập nhật thông tin người dùng thành công!" });
};


module.exports = {
    createUser,
    getUserInfo,
    updateUserByAdmin,
    updateUserSelf
};