const express = require('express');
const {
  handleUserSignup,
  handleUserLogin,
  handleUserLogout,
} = require('../controllers/user');

const router = express.Router();

// Registration
router.post('/signup', handleUserSignup);
router.post('/', handleUserSignup); // Compatibility

// Authentication
router.post('/login', handleUserLogin);

// Logout
router.get('/logout', handleUserLogout);
router.post('/logout', handleUserLogout);

module.exports = router;