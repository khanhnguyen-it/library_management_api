const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

router.post('/create', authenticateToken, isAdminOrLibrarian, borrowController.createBorrow);
router.get('/', authenticateToken, isAdminOrLibrarian, borrowController.getAllBorrows);
router.get('/:id', authenticateToken, isAdminOrLibrarian, borrowController.getBorrowById);
router.get('/by-account/:account_id', authenticateToken, isAdminOrLibrarian, borrowController.getBorrowsByAccount);
router.get('/overdue', authenticateToken, isAdminOrLibrarian, borrowController.getOverdueBorrows);

module.exports = router;
