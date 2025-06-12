const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');


// Tạo thẻ
router.post('/', authenticateToken, isAdminOrLibrarian, cardController.issueCard);

// Gia hạn thẻ
router.put('/:card_id/renew', authenticateToken, isAdminOrLibrarian, cardController.renewCard);

// Cập nhật trạng thái thẻ
router.put('/status', authenticateToken, isAdminOrLibrarian, cardController.changeCardStatus);

module.exports = router;
