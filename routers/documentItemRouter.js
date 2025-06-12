const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentItemController');
const authenticateToken = require('../middlewares/authenticateToken');
const isAdminOrLibrarian = require('../middlewares/isAdminOrLibrarian');

router.post('/', authenticateToken, isAdminOrLibrarian, controller.createDocumentItem);
router.get('/:document_id', authenticateToken, controller.getDocumentItemsByDocument);
router.put('/:id', authenticateToken, isAdminOrLibrarian, controller.updateDocumentItem);
router.delete('/:id', authenticateToken, isAdminOrLibrarian, controller.deleteDocumentItem);

module.exports = router;