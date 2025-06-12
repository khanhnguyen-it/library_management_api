// routers/returnRouter.js
const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

// Tạo phiếu trả mới và xử lý logic vi phạm, hoàn cọc
router.post(
    '/create',
    authenticateToken,
    isAdminOrLibrarian,
    returnController.createReturn
);

// Lấy tất cả phiếu trả
router.get(
    '/',
    authenticateToken,
    isAdminOrLibrarian,
    returnController.getAllReturns
);

// Lấy phiếu trả theo ID
router.get(
    '/:id',
    authenticateToken,
    isAdminOrLibrarian,
    returnController.getReturnById
);

// Lấy danh sách phiếu trả theo account
router.get(
    '/by-account/:account_id',
    authenticateToken,
    isAdminOrLibrarian,
    returnController.getReturnsByAccount
);

module.exports = router;
