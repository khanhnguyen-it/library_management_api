// middlewares/isLibrarian.js
const isLibrarian = (req, res, next) => {
    if (req.user.role_id === 2) { // Giả sử role_id = 2 là Librarian
        next();
    } else {
        res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này!" });
    }
};

module.exports = isLibrarian;
