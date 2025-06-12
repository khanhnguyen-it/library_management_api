const db = require('../utils/db');

// Thêm nhà xuất bản
const createPublisher = async (req, res) => {
    const { publisher_name, established_year, address, phone_number, notes } = req.body;

    if (!publisher_name || publisher_name.trim() === "") {
        return res.status(400).json({ message: "Tên nhà xuất bản là bắt buộc." });
    }

    try {
        const [exists] = await db.query(
            "SELECT * FROM publishers WHERE LOWER(publisher_name) = LOWER(?)",
            [publisher_name.trim()]
        );
        if (exists.length > 0) {
            return res.status(409).json({ message: "Nhà xuất bản đã tồn tại." });
        }

        await db.query(
            `INSERT INTO publishers (publisher_name, established_year, address, phone_number, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [publisher_name.trim(), established_year, address, phone_number, notes]
        );

        res.status(201).json({ message: "Thêm nhà xuất bản thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy tất cả NXB
const getAllPublishers = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM publishers ORDER BY publisher_name");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Chi tiết NXB
const getPublisherById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT * FROM publishers WHERE publisher_id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy NXB." });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật NXB
const updatePublisher = async (req, res) => {
    const { id } = req.params;
    const { publisher_name, established_year, address, phone_number, notes } = req.body;

    try {
        // Lấy NXB hiện tại
        const [exists] = await db.query("SELECT * FROM publishers WHERE publisher_id = ?", [id]);
        if (exists.length === 0) {
            return res.status(404).json({ message: "Nhà xuất bản không tồn tại." });
        }
        const current = exists[0];

        // Nếu người dùng đổi tên NXB → check trùng lặp
        if (
            publisher_name &&
            publisher_name.trim().toLowerCase() !== current.publisher_name.toLowerCase()
        ) {
            const [check] = await db.query(
                "SELECT * FROM publishers WHERE LOWER(publisher_name) = LOWER(?) AND publisher_id != ?",
                [publisher_name.trim(), id]
            );
            if (check.length > 0) {
                return res.status(409).json({ message: "Tên NXB đã tồn tại." });
            }
        }

        // Tiến hành cập nhật (cho phép giữ nguyên các trường nếu null cũng OK)
        await db.query(
            `UPDATE publishers
             SET publisher_name = ?, established_year = ?, address = ?, phone_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
             WHERE publisher_id = ?`,
            [
                publisher_name ?? current.publisher_name,
                established_year ?? current.established_year,
                address ?? current.address,
                phone_number ?? current.phone_number,
                notes ?? current.notes,
                id
            ]
        );

        res.status(200).json({ message: "Cập nhật NXB thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Xóa NXB
const deletePublisher = async (req, res) => {
    const { id } = req.params;
    try {
        // Kiểm tra liên kết với tài liệu
        const [linked] = await db.query(
            "SELECT * FROM publishers_detail WHERE publisher_id = ?",
            [id]
        );
        if (linked.length > 0) {
            return res.status(400).json({ message: "Không thể xóa vì nhà xuất bản đang liên kết với tài liệu." });
        }


        const [result] = await db.query("DELETE FROM publishers WHERE publisher_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Nhà xuất bản không tồn tại." });
        }

        res.status(200).json({ message: "Xóa NXB thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPublisher,
    getAllPublishers,
    getPublisherById,
    updatePublisher,
    deletePublisher
};
