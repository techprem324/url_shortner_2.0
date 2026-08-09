const crypto = require('crypto');
const mongoose = require('mongoose');
const UrlModel = require('../models/url');

/**
 * Generate a clean, URL-safe random string ID (e.g. "8f2a9c7")
 * @param {number} length 
 * @returns {string}
 */
function generateShortId(length = 7) {
  return crypto.randomBytes(Math.ceil(length * 0.75))
    .toString('base64url')
    .slice(0, length);
}

/**
 * Validates and normalizes any valid web URL format.
 * Uses globalThis.URL to avoid collision with Mongoose model name.
 * Accepts:
 * - https://github.com/
 * - https://google.com
 * - google.com
 * - http://example.com/path?query=1#hash
 * - github.com/user/repo
 * - sub.domain.co.uk:8080/test
 * - localhost:3000
 * @param {string} urlString 
 * @returns {string|null} Normalized valid URL string or null
 */
function validateAndNormalizeUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return null;
  let trimmed = urlString.trim();

  // If user omitted protocol (e.g., "google.com" or "github.com/nodejs"), prepend https://
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new globalThis.URL(trimmed);
    
    // Only accept HTTP and HTTPS protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // Must have a valid hostname
    if (!parsed.hostname || parsed.hostname.length < 2) {
      return null;
    }

    return parsed.href;
  } catch (err) {
    return null;
  }
}

/**
 * Validates custom alias slug (e.g. "my-project-link")
 * @param {string} alias 
 * @returns {boolean}
 */
function isValidCustomAlias(alias) {
  if (!alias) return true;
  return /^[a-zA-Z0-9_\-]{3,30}$/.test(alias);
}

/**
 * POST /url or /shorten
 * Generate new short URL or return existing one
 */
async function handleGenerateNewShortURL(req, res) {
  const isJsonRequest = req.xhr || req.headers.accept?.includes('application/json') || req.is('json');

  if (mongoose.connection.readyState !== 1) {
    const errorMsg = 'Database is currently connecting. Please wait a moment or check your connection.';
    if (isJsonRequest) {
      return res.status(503).json({ success: false, error: errorMsg });
    }
    return res.status(503).render('home', {
      urls: [],
      baseUrl: `${req.protocol}://${req.get('host')}`,
      isDbConnected: false,
      error: errorMsg,
      id: null,
      shortUrl: null,
      message: null,
      stats: { totalLinks: 0, totalClicks: 0, userLinks: 0 }
    });
  }

  try {
    const rawUrl = req.body.url || req.body.originalUrl || req.body.redirectUrl || req.body.link;
    const customAlias = req.body.customAlias ? req.body.customAlias.trim() : '';

    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      const err = 'Please enter a URL to shorten.';
      if (isJsonRequest) return res.status(400).json({ success: false, error: err });
      const allUrls = await UrlModel.find({}).sort({ createdAt: -1 });
      return res.status(400).render('home', {
        urls: allUrls,
        baseUrl: `${req.protocol}://${req.get('host')}`,
        isDbConnected: true,
        error: err,
        id: null,
        shortUrl: null,
        message: null,
        stats: { totalLinks: allUrls.length, totalClicks: 0, userLinks: 0 }
      });
    }

    const normalizedUrl = validateAndNormalizeUrl(rawUrl);
    if (!normalizedUrl) {
      const err = 'Invalid URL format. Please enter a valid web link (e.g. google.com or https://example.com).';
      if (isJsonRequest) return res.status(400).json({ success: false, error: err });
      const allUrls = await UrlModel.find({}).sort({ createdAt: -1 });
      return res.status(400).render('home', {
        urls: allUrls,
        baseUrl: `${req.protocol}://${req.get('host')}`,
        isDbConnected: true,
        error: err,
        id: null,
        shortUrl: null,
        message: null,
        stats: { totalLinks: allUrls.length, totalClicks: 0, userLinks: 0 }
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const userId = req.user ? req.user._id : null;

    // Handle Custom Alias
    let shortId = '';
    if (customAlias) {
      if (!isValidCustomAlias(customAlias)) {
        const err = 'Custom alias must be 3-30 characters (letters, numbers, hyphens, or underscores).';
        if (isJsonRequest) return res.status(400).json({ success: false, error: err });
        const allUrls = await UrlModel.find({}).sort({ createdAt: -1 });
        return res.status(400).render('home', {
          urls: allUrls,
          baseUrl,
          isDbConnected: true,
          error: err,
          id: null,
          shortUrl: null,
          message: null,
          stats: { totalLinks: allUrls.length, totalClicks: 0, userLinks: 0 }
        });
      }

      // Check if custom alias is reserved
      const reserved = ['url', 'user', 'test', 'login', 'signup', 'logout', 'api', 'dashboard', 'css', 'js', 'images', 'favicon.ico'];
      if (reserved.includes(customAlias.toLowerCase())) {
        const err = `The alias "${customAlias}" is a reserved system path. Please choose another.`;
        if (isJsonRequest) return res.status(400).json({ success: false, error: err });
        const allUrls = await UrlModel.find({}).sort({ createdAt: -1 });
        return res.status(400).render('home', {
          urls: allUrls,
          baseUrl,
          isDbConnected: true,
          error: err,
          id: null,
          shortUrl: null,
          message: null,
          stats: { totalLinks: allUrls.length, totalClicks: 0, userLinks: 0 }
        });
      }

      const existingAlias = await UrlModel.findOne({ shortId: customAlias });
      if (existingAlias) {
        const err = `The custom alias "${customAlias}" is already in use. Please choose a different one.`;
        if (isJsonRequest) return res.status(409).json({ success: false, error: err });
        const allUrls = await UrlModel.find({}).sort({ createdAt: -1 });
        return res.status(409).render('home', {
          urls: allUrls,
          baseUrl,
          isDbConnected: true,
          error: err,
          id: null,
          shortUrl: null,
          message: null,
          stats: { totalLinks: allUrls.length, totalClicks: 0, userLinks: 0 }
        });
      }

      shortId = customAlias;
    } else {
      // Check if URL already exists without custom alias
      let existingEntry = await UrlModel.findOne({
        $or: [{ originalUrl: normalizedUrl }, { redirectUrl: normalizedUrl }]
      });

      if (existingEntry) {
        const shortUrl = `${baseUrl}/${existingEntry.shortId}`;
        if (isJsonRequest) {
          return res.status(200).json({
            success: true,
            isExisting: true,
            message: 'URL was already shortened! Reusing existing link.',
            shortId: existingEntry.shortId,
            shortUrl,
            originalUrl: existingEntry.originalUrl || existingEntry.redirectUrl,
            clicks: existingEntry.clicks || existingEntry.visitHistory?.length || 0,
            createdAt: existingEntry.createdAt,
          });
        }

        const allUrls = await UrlModel.find({}).sort({ createdAt: -1 });
        return res.render('home', {
          id: existingEntry.shortId,
          shortUrl,
          urls: allUrls,
          baseUrl,
          isDbConnected: true,
          message: 'URL already existed. Reused existing short link!',
          error: null,
          stats: { totalLinks: allUrls.length, totalClicks: 0, userLinks: 0 }
        });
      }

      // Generate random unique shortId
      shortId = generateShortId(7);
      let collision = await UrlModel.findOne({ shortId });
      while (collision) {
        shortId = generateShortId(7);
        collision = await UrlModel.findOne({ shortId });
      }
    }

    // Create URL document
    const newUrlDoc = await UrlModel.create({
      shortId,
      originalUrl: normalizedUrl,
      redirectUrl: normalizedUrl,
      customAlias: customAlias || null,
      clicks: 0,
      visitHistory: [],
      createdBy: userId,
    });

    const shortUrl = `${baseUrl}/${shortId}`;

    if (isJsonRequest) {
      return res.status(201).json({
        success: true,
        isExisting: false,
        message: 'Short URL created successfully!',
        shortId: newUrlDoc.shortId,
        shortUrl,
        originalUrl: newUrlDoc.originalUrl,
        clicks: 0,
        createdAt: newUrlDoc.createdAt,
      });
    }

    const allUrls = await UrlModel.find({}).sort({ createdAt: -1 });
    return res.render('home', {
      id: shortId,
      shortUrl,
      urls: allUrls,
      baseUrl,
      isDbConnected: true,
      message: 'Short URL created successfully!',
      error: null,
      stats: { totalLinks: allUrls.length, totalClicks: 0, userLinks: 0 }
    });

  } catch (error) {
    console.error('Error generating short URL:', error);
    if (isJsonRequest) {
      return res.status(500).json({ success: false, error: 'Internal server error while generating short URL.' });
    }
    return res.status(500).render('home', {
      urls: [],
      baseUrl: `${req.protocol}://${req.get('host')}`,
      isDbConnected: false,
      error: 'An unexpected error occurred. Please try again.',
      id: null,
      shortUrl: null,
      message: null,
      stats: { totalLinks: 0, totalClicks: 0, userLinks: 0 }
    });
  }
}

/**
 * GET /url/analytics/:shortId
 */
async function handleGetAnalytics(req, res) {
  try {
    const { shortId } = req.params;
    const entry = await UrlModel.findOne({ shortId });

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Short URL not found.' });
    }

    const totalClicks = typeof entry.clicks === 'number' ? entry.clicks : (entry.visitHistory?.length || 0);

    return res.json({
      success: true,
      shortId: entry.shortId,
      originalUrl: entry.originalUrl || entry.redirectUrl,
      totalClicks,
      analytics: entry.visitHistory || [],
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve analytics.' });
  }
}

/**
 * GET /url/all
 */
async function handleGetAllUrls(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      count: 0,
      baseUrl: `${req.protocol}://${req.get('host')}`,
      urls: [],
      isDbConnected: false,
    });
  }

  try {
    const filter = {};
    if (req.query.my === 'true' && req.user) {
      filter.createdBy = req.user._id;
    }

    const allUrls = await UrlModel.find(filter).sort({ createdAt: -1 }).limit(100);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.json({
      success: true,
      count: allUrls.length,
      baseUrl,
      isDbConnected: true,
      urls: allUrls.map(u => ({
        shortId: u.shortId,
        originalUrl: u.originalUrl || u.redirectUrl,
        shortUrl: `${baseUrl}/${u.shortId}`,
        clicks: typeof u.clicks === 'number' ? u.clicks : (u.visitHistory?.length || 0),
        createdAt: u.createdAt,
        isCustom: !!u.customAlias,
      }))
    });
  } catch (error) {
    console.error('Error fetching URLs:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve URLs.' });
  }
}

/**
 * DELETE /url/:shortId
 */
async function handleDeleteURL(req, res) {
  try {
    const { shortId } = req.params;
    const deleted = await UrlModel.findOneAndDelete({ shortId });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'URL not found or already deleted.' });
    }
    return res.json({ success: true, message: 'URL deleted successfully.', shortId });
  } catch (error) {
    console.error('Error deleting URL:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete URL.' });
  }
}

module.exports = {
  handleGenerateNewShortURL,
  handleGetAnalytics,
  handleGetAllUrls,
  handleDeleteURL,
  validateAndNormalizeUrl,
};