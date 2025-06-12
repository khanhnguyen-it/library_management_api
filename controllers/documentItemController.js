const db = require('../utils/db');

// Thêm bản sao mới cho tài liệu (barcode sinh tự động)
const createDocumentItem = async (req, res) => {
    const { document_id, shelf_location, condition_status, availability_status, is_reference_only, notes } = req.body;
    if (!document_id) {
        return res.status(400).json({ message: "Thiếu mã tài liệu." });
    }

    try {
        const [[doc]] = await db.query("SELECT * FROM documents WHERE document_id = ?", [document_id]);
        if (!doc) {
            return res.status(400).json({ message: "Tài liệu không tồn tại!" });
        }

        const [[count]] = await db.query(
            "SELECT COUNT(*) AS total FROM document_items WHERE document_id = ?",
            [document_id]
        );
        const sequence = count.total + 1;
        const barcode = `BK${String(document_id).padStart(4, '0')}-${sequence}`;

        await db.query(
            `INSERT INTO document_items (document_id, barcode, shelf_location, condition_status, availability_status, is_reference_only, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [document_id, barcode, shelf_location, condition_status, availability_status, is_reference_only, notes]
        );
        res.status(201).json({ message: "Thêm bản sao thành công.", barcode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách bản sao theo document_id
const getDocumentItemsByDocument = async (req, res) => {
    const { document_id } = req.params;
    try {
        const [items] = await db.query("SELECT * FROM document_items WHERE document_id = ?", [document_id]);
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateDocumentItem = async (req, res) => {
    const { id } = req.params;
    const allowedFields = ["shelf_location", "condition_status", "availability_status", "is_reference_only", "notes"];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
        if (req.body.hasOwnProperty(field)) {
            updates.push(`${field} = ?`);
            values.push(req.body[field]);
        }
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: "Không có trường nào được cập nhật." });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const sql = `UPDATE document_items SET ${updates.join(", ")} WHERE document_item_id = ?`;
    try {
        await db.query(sql, values);
        res.status(200).json({ message: "Cập nhật bản sao thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xoá bản sao (chỉ khi không đang được mượn)
const deleteDocumentItem = async (req, res) => {
    const { id } = req.params;
    try {
        const [[item]] = await db.query(
            "SELECT * FROM document_items WHERE document_item_id = ?",
            [id]
        );

        if (!item) {
            return res.status(404).json({ message: "Bản sao không tồn tại." });
        }

        if (item.availability_status === 'BORROWED') {
            return res.status(400).json({ message: "Không thể xoá bản sao đang được mượn." });
        }

        await db.query("DELETE FROM document_items WHERE document_item_id = ?", [id]);
        res.status(200).json({ message: "Xoá bản sao thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createDocumentItem,
    getDocumentItemsByDocument,
    updateDocumentItem,
    deleteDocumentItem
};