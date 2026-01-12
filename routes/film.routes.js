const express = require('express');
const router = express.Router();
const filmCtrl = require('../controllers/film.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const genreCtrl = require('../controllers/genre.controller');

// Public
router.get('/', filmCtrl.listFilms);
router.get('/:id/genres', genreCtrl.listGenresForFilm);

// Admin-only
router.post('/', auth, admin, filmCtrl.createFilm);
// Alias for forms/clients that post to /films/add
router.post('/add', auth, admin, filmCtrl.createFilm);

// Admin-only update and delete
router.put('/:id', auth, admin, filmCtrl.updateFilm);
router.delete('/:id', auth, admin, filmCtrl.deleteFilm);

// Admin endpoints to manage film-genre associations
router.post('/:id/genres', auth, admin, genreCtrl.addGenreToFilm);
router.delete('/:id/genres/:genreId', auth, admin, genreCtrl.removeGenreFromFilm);

module.exports = router;