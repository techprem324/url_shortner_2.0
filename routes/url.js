const express = require('express');
const {
  handleGenerateNewShortURL,
  handleGetAnalytics,
  handleGetAllUrls,
  handleDeleteURL,
} = require('../controllers/url');

const router = express.Router();

// Generate short URL
router.post('/', handleGenerateNewShortURL);
router.post('/shorten', handleGenerateNewShortURL);

// Analytics for specific short URL
router.get('/analytics/:shortId', handleGetAnalytics);

// Fetch all URLs for dashboard refresh
router.get('/all', handleGetAllUrls);

// Delete shortened link
router.delete('/:shortId', handleDeleteURL);

module.exports = router;
