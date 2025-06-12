const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token;

    // Ưu tiên token trong Header nếu có
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log("Token từ Header:", token);
    } else if (req.body && req.body.token) {
        token = req.body.token;
        console.log("Token từ Body:", token);
    }

    // Log token để kiểm tra
    console.log("[TOKEN RAW]", authHeader);
    console.log("[TOKEN EXTRACTED]", token);

    if (!token) {
        console.log("Không có token!");
        return res.status(401).json({ message: 'Không có token!' });
    }

    // Log SECRET_KEY để đảm bảo nạp đúng
    console.log("[SECRET_KEY]", process.env.SECRET_KEY);

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            console.log("Token không hợp lệ:", err.message);
            return res.status(403).json({ message: 'Token không hợp lệ!' });
        }

        // Nếu hợp lệ, gán user cho req
        console.log("Token hợp lệ, user:", user);
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
