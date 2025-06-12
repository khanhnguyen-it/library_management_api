const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authenticateToken = require('../middlewares/authenticateToken');
const isLibrarian = require('../middlewares/isLibrarian');


router.post('/create', authenticateToken, isLibrarian,
    reservationController.createReservation);
router.post('/cancel', authenticateToken, isLibrarian,
    reservationController.cancelReservation);
router.post('/notify', authenticateToken, isLibrarian,
    reservationController.notifyNextUser);
router.get('/by-document/:document_item_id', authenticateToken, isLibrarian,
    reservationController.getReservationsByDocumentItem);
router.get('/auto-expire', authenticateToken, isLibrarian,
    reservationController.autoExpireReservations);
router.get('/', authenticateToken, isLibrarian,
    reservationController.getAllReservations);
router.get('/:id', authenticateToken, isLibrarian,
    reservationController.getReservationById);
router.get('/by-account/:account_id', authenticateToken, isLibrarian,
    reservationController.getReservationsByAccount);


module.exports = router;
