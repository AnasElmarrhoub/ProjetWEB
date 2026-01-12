const express = require('express');
const router = express.Router();
const salleCtrl = require('../controllers/salle.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// Public: list all salles
router.get('/', salleCtrl.listSalles);
// Public: get seats for a salle
router.get('/:id/seats', salleCtrl.getSalleSeats);

// Admin: create salle (template or rows) and delete
router.post('/', auth, admin, salleCtrl.createSalle);
router.delete('/:id', auth, admin, salleCtrl.deleteSalle);

module.exports = router;