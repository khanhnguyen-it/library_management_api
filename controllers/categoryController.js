const db = require('../utils/db');

// Thêm thể loại mới
const createCategory = async (req, res) => {
    const { category_name, description } = req.body;

    if (!category_name || category_name.trim() === "") {
        return res.status(400).json({ message: "Tên thể loại là bắt buộc." });
    }

    try {
        const [exists] = await db.query(
            "SELECT * FROM categories WHERE LOWER(category_name) = LOWER(?)",
            [category_name.trim()]
        );
        if (exists.length > 0) {
            return res.status(409).json({ message: "Thể loại đã tồn tại." });
        }

        await db.query(
            "INSERT INTO categories (category_name, description) VALUES (?, ?)",
            [category_name.trim(), description]
        );

        res.status(201).json({ message: "Thêm thể loại thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xem tất cả thể loại
const getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM categories ORDER BY category_name");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xem chi tiết
const getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT * FROM categories WHERE category_id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy thể loại." });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { category_name, description } = req.body;

    try {
        const [exists] = await db.query("SELECT * FROM categories WHERE category_id = ?", [id]);
        if (exists.length === 0) {
            return res.status(404).json({ message: "Thể loại không tồn tại." });
        }

        if (category_name) {
            const [check] = await db.query(
                "SELECT * FROM categories WHERE LOWER(category_name) = LOWER(?) AND category_id != ?",
                [category_name.trim(), id]
            );
            if (check.length > 0) {
                return res.status(409).json({ message: "Tên thể loại đã tồn tại." });
            }
        }

        await db.query(
            "UPDATE categories SET category_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE category_id = ?",
            [category_name, description, id]
        );

        res.status(200).json({ message: "Cập nhật thể loại thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xóa thể loại
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        // Kiểm tra liên kết với tài liệu
        const [linked] = await db.query(
            "SELECT * FROM categories_detail WHERE category_id = ?",
            [id]
        );
        if (linked.length > 0) {
            return res.status(400).json({ message: "Không thể xóa vì thể loại đang liên kết với tài liệu." });
        }

        const [result] = await db.query("DELETE FROM categories WHERE category_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Thể loại không tồn tại." });
        }

        res.status(200).json({ message: "Xóa thể loại thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
