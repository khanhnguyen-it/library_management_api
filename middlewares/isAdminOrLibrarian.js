module.exports = (req, res, next) => {
    const role = req.user.role_id;
    if (role === 1 || role === 2) {
        next();
    } else {
        res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này!" });
    }
};

