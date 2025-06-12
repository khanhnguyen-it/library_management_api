const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

router.post('/', authenticateToken, isAdminOrLibrarian, authorController.createAuthor);
router.get('/', authenticateToken, authorController.getAllAuthors);
router.get('/:id', authenticateToken, authorController.getAuthorById);
router.put('/:id', authenticateToken, isAdminOrLibrarian, authorController.updateAuthor);
router.delete('/:id', authenticateToken, isAdminOrLibrarian, authorController.deleteAuthor);

module.exports = router;
