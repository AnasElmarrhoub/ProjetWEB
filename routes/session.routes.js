const express = require('express');
const router = express.Router();
const sessionCtrl = require('../controllers/session.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// Public: list sessions
router.get('/', sessionCtrl.listSessions);
// Public: available seats for a session
router.get('/:id/available-seats', sessionCtrl.availableSeats);

// Admin: create, update, delete
router.post('/', auth, admin, sessionCtrl.createSession);
router.put('/:id', auth, admin, sessionCtrl.updateSession);
router.delete('/:id', auth, admin, sessionCtrl.deleteSession);

module.exports = router;
