const db = require('../utils/db');

// Thêm tài liệu mới
const createDocument = async (req, res) => {
    const {
        document_title, description, document_type, publication_year,
        language, page_count, cover_image, isbn, notes
    } = req.body;

    if (!document_title || !document_type || !page_count) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
    }

    try {
        const [exists] = await db.query(
            "SELECT * FROM documents WHERE LOWER(document_title) = LOWER(?) AND publication_year = ?",
            [document_title.trim(), publication_year]
        );
        if (exists.length > 0) {
            return res.status(409).json({ message: "Tài liệu này đã tồn tại." });
        }

        await db.query(
            `INSERT INTO documents 
            (document_title, description, document_type, publication_year, language, page_count, cover_image, isbn, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [document_title, description, document_type, publication_year, language, page_count, cover_image, isbn, notes]
        );

        res.status(201).json({ message: "Thêm tài liệu thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách tài liệu
const getAllDocuments = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM documents ORDER BY updated_at DESC");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xem chi tiết tài liệu
const getDocumentById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query("SELECT * FROM documents WHERE document_id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu." });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Lấy chi tiết tồn kho 1 tài liệu
const getDocumentStock = async (req, res) => {
    const { id } = req.params;
    try {
        const [[document]] = await db.query("SELECT * FROM documents WHERE document_id = ?", [id]);
        if (!document) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu." });
        }

        const [[stock]] = await db.query(`
            SELECT 
                COUNT(*) AS total,
                SUM(availability_status = 'AVAILABLE') AS available,
                SUM(availability_status = 'BORROWED') AS borrowed,
                SUM(availability_status = 'RESERVED') AS reserved,
                SUM(availability_status = 'LOST') AS lost
            FROM document_items
            WHERE document_id = ?`,
            [id]
        );

        res.status(200).json({
            document_id: id,
            title: document.document_title,
            ...stock
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật tài liệu
const updateDocument = async (req, res) => {
    const { id } = req.params;
    const allowedFields = [
        "document_title", "description", "document_type", "publication_year",
        "language", "page_count", "cover_image", "isbn", "document_status", "notes"
    ];
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

    const sql = `UPDATE documents SET ${updates.join(", ")} WHERE document_id = ?`;
    try {
        await db.query(sql, values);
        res.status(200).json({ message: "Cập nhật tài liệu thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Xoá tài liệu (chỉ khi không có bản sao đang được mượn)
const deleteDocument = async (req, res) => {
    const { id } = req.params;
    try {
        const [[document]] = await db.query("SELECT * FROM documents WHERE document_id = ?", [id]);
        if (!document) {
            return res.status(404).json({ message: "Tài liệu không tồn tại." });
        }

        const [[countBorrowed]] = await db.query(
            `SELECT COUNT(*) AS borrowed_count FROM document_items
             WHERE document_id = ? AND availability_status = 'BORROWED'`,
            [id]
        );

        if (countBorrowed.borrowed_count > 0) {
            return res.status(400).json({ message: "Không thể xoá vì có bản sao đang được mượn." });
        }

        await db.query("DELETE FROM documents WHERE document_id = ?", [id]);
        res.status(200).json({ message: "Xoá tài liệu thành công." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Tìm kiếm tài liệu theo tiêu đề, ISBN, tác giả, thể loại, nhà xuất bản
const searchDocuments = async (req, res) => {
    const { keyword } = req.query;
    if (!keyword || keyword.trim() === '') {
        return res.status(400).json({ message: 'Thiếu từ khóa tìm kiếm' });
    }
    try {
        const [rows] = await db.query(`
      SELECT 
        d.*,
        GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
        GROUP_CONCAT(DISTINCT c.category_name SEPARATOR ', ') AS categories,
        GROUP_CONCAT(DISTINCT p.publisher_name SEPARATOR ', ') AS publishers
      FROM documents d
      LEFT JOIN authors_detail ad ON d.document_id = ad.document_id
      LEFT JOIN authors a ON ad.author_id = a.author_id
      LEFT JOIN categories_detail cd ON d.document_id = cd.document_id
      LEFT JOIN categories c ON cd.category_id = c.category_id
      LEFT JOIN publishers_detail pd ON d.document_id = pd.document_id
      LEFT JOIN publishers p ON pd.publisher_id = p.publisher_id
      WHERE 
        d.document_title LIKE ? OR
        d.isbn LIKE ? OR
        a.author_name LIKE ? OR
        c.category_name LIKE ? OR
        p.publisher_name LIKE ?
      GROUP BY d.document_id
      ORDER BY d.document_title ASC
    `, [
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`,
            `%${keyword}%`
        ]);

        if (rows.length === 0) {
            return res.status(200).json({ message: 'Không tìm thấy tài liệu phù hợp', data: [] });
        }

        return res.status(200).json({ data: rows });
    } catch (err) {
        console.error('Lỗi khi tìm kiếm tài liệu:', err);
        return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
};


module.exports = {
    createDocument,
    getAllDocuments,
    getDocumentById,
    getDocumentStock,
    updateDocument,
    deleteDocument,
    searchDocuments
};
