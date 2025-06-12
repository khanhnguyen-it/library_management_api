const db = require('../utils/db');

// Thêm tác giả mới
const createAuthor = async (req, res) => {
    const { author_name, biography, date_of_birth, nationality } = req.body;

    if (!author_name || author_name.trim() === "") {
        return res.status(400).json({ message: "Tên tác giả là bắt buộc." });
    }

    try {
        // Kiểm tra trùng tên (không phân biệt hoa thường)
        const [exists] = await db.query(
            `SELECT * FROM authors WHERE LOWER(author_name) = LOWER(?)`,
            [author_name.trim()]
        );
        if (exists.length > 0) {
            return res.status(409).json({ message: "Tác giả đã tồn tại." });
        }

        await db.query(
            `INSERT INTO authors (author_name, biography, date_of_birth, nationality)
             VALUES (?, ?, ?, ?)`,
            [author_name.trim(), biography, date_of_birth, nationality]
        );

        res.status(201).json({ message: "Thêm tác giả thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách tất cả tác giả
const getAllAuthors = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM authors ORDER BY author_name");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xem chi tiết một tác giả
const getAuthorById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT * FROM authors WHERE author_id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy tác giả." });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật thông tin tác giả
const updateAuthor = async (req, res) => {
    const { id } = req.params;
    const { author_name, biography, date_of_birth, nationality } = req.body;

    try {
        // Kiểm tra tồn tại tác giả
        const [exists] = await db.query("SELECT * FROM authors WHERE author_id = ?", [id]);
        if (exists.length === 0) {
            return res.status(404).json({ message: "Tác giả không tồn tại." });
        }

        // Nếu đổi tên, kiểm tra trùng lặp
        if (author_name) {
            const [nameCheck] = await db.query(
                "SELECT * FROM authors WHERE LOWER(author_name) = LOWER(?) AND author_id != ?",
                [author_name.trim(), id]
            );
            if (nameCheck.length > 0) {
                return res.status(409).json({ message: "Tên tác giả đã tồn tại." });
            }
        }

        await db.query(
            `UPDATE authors
             SET author_name = ?, biography = ?, date_of_birth = ?, nationality = ?, updated_at = CURRENT_TIMESTAMP
             WHERE author_id = ?`,
            [author_name, biography, date_of_birth, nationality, id]
        );

        res.status(200).json({ message: "Cập nhật tác giả thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xóa tác giả (nếu không liên kết tài liệu)
const deleteAuthor = async (req, res) => {
    const { id } = req.params;
    try {
        // Kiểm tra liên kết với tài liệu
        const [linked] = await db.query(
            "SELECT * FROM authors_detail WHERE author_id = ?",
            [id]
        );
        if (linked.length > 0) {
            return res.status(400).json({ message: "Không thể xóa vì tác giả đang liên kết với tài liệu." });
        }

        const [result] = await db.query("DELETE FROM authors WHERE author_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Tác giả không tồn tại." });
        }

        res.status(200).json({ message: "Xóa tác giả thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createAuthor,
    getAllAuthors,
    getAuthorById,
    updateAuthor,
    deleteAuthor
};
