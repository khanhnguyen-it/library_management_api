const db = require('../utils/db');
const crypto = require('crypto');

// Sinh mã thẻ duy nhất
const generateCardCode = async () => {
    let code;
    let exists = true;
    while (exists) {
        code = 'CARD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const [rows] = await db.query("SELECT * FROM cards WHERE card_code = ?", [code]);
        exists = rows.length > 0;
    }
    return code;
};

// Cấp thẻ mới
const issueCard = async (req, res) => {
    const { reader_code, expiry_date, note } = req.body;

    if (!reader_code || !expiry_date) {
        return res.status(400).json({ message: "Thiếu reader_code hoặc expiry_date!" });
    }

    try {
        // Lấy account_id từ reader_code
        const [userRows] = await db.query("SELECT account_id FROM accounts WHERE reader_code = ?", [reader_code]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng với mã độc giả này!" });
        }
        const account_id = userRows[0].account_id;

        // Kiểm tra đã có thẻ chưa
        const [existing] = await db.query("SELECT * FROM cards WHERE account_id = ?", [account_id]);
        if (existing.length > 0) {
            return res.status(409).json({ message: "Người dùng này đã có thẻ thư viện!" });
        }

        const card_code = await generateCardCode();

        // Lấy ngày hiện tại
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const expiry = new Date(expiry_date);

        // So sánh ngày expiry >= issue
        if (expiry < today) {
            return res.status(400).json({ message: "Ngày hết hạn phải lớn hơn cấp thẻ!" });
        }

        const [result] = await db.query(`
            INSERT INTO cards (card_code, account_id, issue_date, expiry_date, note)
            VALUES (?, ?, ?, ?, ?)`,
            [card_code, account_id, todayStr, expiry_date, note]
        );

        return res.status(201).json({
            message: "Cấp thẻ thư viện thành công!",
            card_id: result.insertId,
            card_code
        });

    } catch (error) {
        return res.status(500).json({ message: "Lỗi khi cấp thẻ!", error: error.message });
    }
};


// Gia hạn thẻ
const renewCard = async (req, res) => {
    const { card_code, new_expiry_date } = req.body;

    if (!card_code || !new_expiry_date) {
        return res.status(400).json({ message: "Thiếu card_code hoặc new_expiry_date!" });
    }

    try {
        // Lấy thông tin thẻ
        const [cardRows] = await db.query("SELECT * FROM cards WHERE card_code = ?", [card_code]);
        if (cardRows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy thẻ với mã card_code này!" });
        }

        const card = cardRows[0];
        const currentStatus = card.status;
        const currentExpiry = new Date(card.expiry_date);
        const newExpiry = new Date(new_expiry_date);
        const today = new Date();

        // Không cho phép gia hạn nếu trạng thái không hợp lệ
        if (!['ACTIVE', 'EXPIRED'].includes(currentStatus)) {
            return res.status(400).json({ message: "Trạng thái thẻ không bình thường! Không thể gia hạn." });
        }

        // Nếu đang ACTIVE → new_expiry > expiry_date
        if (currentStatus === 'ACTIVE' && newExpiry <= currentExpiry) {
            return res.status(400).json({ message: "Ngày hết hạn mới phải lớn hơn ngày hết hạn hiện tại!" });
        }

        // Nếu đang EXPIRED → new_expiry > hôm nay
        if (currentStatus === 'EXPIRED' && newExpiry <= today) {
            return res.status(400).json({ message: "Ngày hết hạn mới phải lớn hơn ngày hiện tại!" });
        }

        // Cập nhật gia hạn
        await db.query(
            "UPDATE cards SET expiry_date = ?, updated_at = CURRENT_TIMESTAMP WHERE card_code = ?",
            [new_expiry_date, card_code]
        );

        res.status(200).json({ message: "Gia hạn thẻ thành công!" });

    } catch (error) {
        res.status(500).json({ message: "Lỗi khi gia hạn thẻ!", error: error.message });
    }
};

// Thay đổi trạng thái thẻ
const changeCardStatus = async (req, res) => {
    const { card_code, status, note } = req.body;

    const validStatuses = ['ACTIVE', 'EXPIRED', 'LOST', 'BLOCKED'];

    if (!card_code || !status) {
        return res.status(400).json({ message: "Thiếu card_code hoặc status!" });
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ!" });
    }

    try {
        const [rows] = await db.query("SELECT * FROM cards WHERE card_code = ?", [card_code]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy thẻ thư viện!" });
        }

        await db.query(
            "UPDATE cards SET status = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE card_code = ?",
            [status, note, card_code]
        );

        res.status(200).json({ message: `Cập nhật trạng thái thẻ thành ${status} thành công!` });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật trạng thái thẻ!", error: error.message });
    }
};

module.exports = {
    issueCard,
    renewCard,
    changeCardStatus
};
