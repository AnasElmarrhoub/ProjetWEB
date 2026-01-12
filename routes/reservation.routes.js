const express = require('express');
const router = express.Router();
const reservationCtrl = require('../controllers/reservation.controller');
const auth = require('../middleware/auth.middleware');

// Create a reservation (authenticated users)
router.post('/', auth, reservationCtrl.createReservation);

// List reservations: user's reservations or all for admin
router.get('/', auth, reservationCtrl.listReservations);

// Cancel a reservation (user owns it or admin)
router.delete('/:id', auth, reservationCtrl.cancelReservation);

// Cancel reservation by session and seat (useful if user knows session+seat)
// Accepts JSON body { id_sceance, id_siege }
router.delete('/by-seat', auth, reservationCtrl.cancelBySeat);
// Alternate (POST) for clients/tools that don't support DELETE bodies
router.post('/cancel-by-seat', auth, reservationCtrl.cancelBySeat);

module.exports = router;
