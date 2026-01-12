const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user.controller');
const auth = require('../middleware/auth.middleware');

// ================= ROUTES PUBLIQUES =================
router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);

// ================= ROUTES PROTÉGÉES (AUTHENTIFICATION REQUISE) =================
router.post('/logout', auth, userCtrl.logout);
router.get('/me', auth, userCtrl.me);
router.put('/password', auth, userCtrl.updatePassword);
router.put('/profile', auth, userCtrl.updateProfile);
router.delete('/account', auth, userCtrl.deleteAccount);

module.exports = router;