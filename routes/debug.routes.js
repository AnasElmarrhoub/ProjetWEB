const express = require('express');
const router = express.Router();
const debugCtrl = require('../controllers/debug.controller');

// Public diagnostic endpoint to list FILM table columns
router.get('/film-columns', debugCtrl.filmColumns);

module.exports = router;
