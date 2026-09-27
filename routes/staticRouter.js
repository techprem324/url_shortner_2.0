const express = require('express');
const mongoose = require('mongoose');
const URL = require('../models/url');

const router = express.Router();

// Home Dashboard View
router.get('/', async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const baseUrl = (process.env.BASE_URL && process.env.NODE_ENV === 'production' && !process.env.BASE_URL.includes('localhost'))
    ? process.env.BASE_URL.replace(/\/$/, '')
    : `${req.protocol}://${req.get('host')}`;
  const user = req.user || null;

  if (!isDbConnected) {
    return res.render('home', {
      urls: [],
      baseUrl,
      user,
      isDbConnected: false,
      stats: { totalLinks: 0, totalClicks: 0, userLinks: 0 },
      id: null,
      shortUrl: null,
      error: null,
      message: null,
    });
  }

  try {
    // If logged in, fetch user links; otherwise fetch recent global links
    const filter = user ? { createdBy: user._id } : {};
    const allUrls = await URL.find(filter).sort({ createdAt: -1 });
    const globalCount = await URL.countDocuments();

    const totalClicks = allUrls.reduce((sum, u) => {
      const count = typeof u.clicks === 'number' ? u.clicks : (u.visitHistory?.length || 0);
      return sum + count;
    }, 0);

    const stats = {
      totalLinks: globalCount,
      userLinks: allUrls.length,
      totalClicks,
      isUserView: !!user,
    };

    return res.render('home', {
      urls: allUrls,
      baseUrl,
      user,
      isDbConnected: true,
      stats,
      id: null,
      shortUrl: null,
      error: null,
      message: req.query.welcome ? `Welcome, ${user?.name || 'there'}! Your account is active.` : null,
    });
  } catch (error) {
    console.error('Error loading home view:', error.message);
    return res.render('home', {
      urls: [],
      baseUrl,
      user,
      isDbConnected: false,
      stats: { totalLinks: 0, totalClicks: 0, userLinks: 0 },
      id: null,
      shortUrl: null,
      error: 'Could not fetch links from MongoDB.',
      message: null,
    });
  }
});

// Login Page
router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('auth', {
    tab: 'login',
    error: null,
    success: null,
    email: req.query.email || '',
    user: null,
  });
});

// Signup Page
router.get('/signup', (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('auth', {
    tab: 'signup',
    error: null,
    success: null,
    name: '',
    email: '',
    user: null,
  });
});

module.exports = router;