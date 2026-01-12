const express = require('express');
const router = express.Router();
const genreCtrl = require('../controllers/genre.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// Public
router.get('/', genreCtrl.listGenres);
router.get('/:id/films', genreCtrl.listFilmsByGenre);

// Admin
router.post('/', auth, admin, genreCtrl.createGenre);

module.exports = router;