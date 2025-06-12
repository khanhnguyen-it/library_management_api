// controllers/authController.js
const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { sendMail } = require('../utils/emailService');
dotenv.config();



// Đăng nhập
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu!" });
    }

    try {
        const [user] = await db.query("SELECT * FROM accounts WHERE username = ?", [username]);
        if (
            user.length === 0 ||
            !(await bcrypt.compare(password, user[0].password))
        ) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng!" });
        }

        //Tạo reset token
        const token = jwt.sign(
            {
                account_id: user[0].account_id,
                username: user[0].username,
                role_id: user[0].role_id,
            },
            process.env.SECRET_KEY,
            { expiresIn: "7d" }
        );

        res.status(200).json({ message: "Đăng nhập thành công!", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Quên mật khẩu - gửi reset token
const forgotPassword = async (req, res) => {
    const { username, email } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM accounts WHERE username = ? AND email = ?", [username, email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Tài khoản hoặc email không đúng!" });
        }
        const user = users[0];
        const resetToken = jwt.sign(
            { account_id: user.account_id, username: user.username },
            process.env.SECRET_KEY,
            { expiresIn: "15m" }
        );

        console.log("✅ Reset token:", resetToken);
        res.status(200).json({
            message: "Send new password to link reset password.",
            resetToken
        });

        const resetLink = `http://localhost:8080/reset-password?token=${resetToken}`;
        // console.log("Fake email link (for testing):", resetLink);
        await sendMail(email, "Reset mật khẩu", `Click vào link sau để đặt lại mật khẩu: ${resetLink}`);
        res.status(200).json({ message: "Send new password to link reset password", resetToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Đặt lại mật khẩu từ token (quên mật khẩu)
const resetPassword = async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    try {
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "Thiếu thông tin!" });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Mật khẩu mới không khớp!" });
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const hashed = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE accounts SET password = ? WHERE account_id = ?", [hashed, decoded.account_id]);
        res.status(200).json({ message: "Đặt lại mật khẩu thành công!" });
    } catch (error) {
        res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn!", error: error.message });
    }
};

// Đổi mật khẩu sau khi đăng nhập
const changePassword = async (req, res) => {
    const accountId = req.user.account_id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    try {
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Mật khẩu mới không khớp!" });
        }
        const [users] = await db.query("SELECT * FROM accounts WHERE account_id = ?", [accountId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Tài khoản không tồn tại!" });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu cũ không đúng!" });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE accounts SET password = ? WHERE account_id = ?", [hashed, accountId]);
        res.status(200).json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Đăng xuất (client xóa token)
const logout = (req, res) => {
    res.status(200).json({ message: "Đăng xuất thành công!" });
};

module.exports = {
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword
};
