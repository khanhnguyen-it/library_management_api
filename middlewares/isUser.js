const isUser = (req, res, next) => {
    if (req.user && req.user.role_id === 3) {
        next();
    } else {
        res.status(403).json({ message: "Chỉ người dùng thông thường mới được phép thực hiện thao tác này." });
    }
};

module.exports = isUser;
