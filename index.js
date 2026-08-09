require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { connectToMongoDB } = require('./connect');
const { checkAuth } = require('./middlewares/auth');
const urlRoute = require('./routes/url');
const staticRoute = require('./routes/staticRouter');
const userRoute = require('./routes/user');
const URL = require('./models/url');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global Auth State Middleware (populates req.user & res.locals.user)
app.use(checkAuth);

// Rate limiter on URL generation to prevent spam
const createUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Mount Routes
app.use('/url', createUrlLimiter, urlRoute);
app.use('/shorten', createUrlLimiter, urlRoute);
app.use('/user', userRoute);
app.use('/', staticRoute);

// Test endpoint
app.get('/test', async (req, res) => {
  try {
    const allUrls = await URL.find({});
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>QuickLink Diagnostics</title><style>body{font-family:sans-serif;padding:24px;line-height:1.6;background:#0d1117;color:#c9d1d9;}a{color:#58a6ff;}</style></head>
      <body>
        <h2>Active Database Records (${allUrls.length})</h2>
        <ul>
          ${allUrls
            .map(
              (u) =>
                `<li><strong>/${u.shortId}</strong> &rarr; <a href="${u.originalUrl || u.redirectUrl}" target="_blank">${u.originalUrl || u.redirectUrl}</a> (Clicks: ${u.clicks || u.visitHistory?.length || 0})</li>`
            )
            .join('')}
        </ul>
        <p><a href="/">&larr; Return to Dashboard</a></p>
      </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send('Error loading test view: ' + err.message);
  }
});

// Dynamic Redirection Route: GET /:shortId
app.get('/:shortId', async (req, res) => {
  const shortId = req.params.shortId;

  // Reserved paths to ignore
  const reserved = ['favicon.ico', 'robots.txt', 'css', 'js', 'images', 'login', 'signup', 'logout', 'url', 'user', 'test'];
  if (reserved.includes(shortId.toLowerCase())) {
    return res.status(404).end();
  }

  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

    const entry = await URL.findOneAndUpdate(
      { shortId },
      {
        $inc: { clicks: 1 },
        $push: {
          visitHistory: {
            timestamp: Date.now(),
            ip: clientIp,
            userAgent: userAgent,
          },
        },
      },
      { new: true }
    );

    if (!entry) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: 'Short URL not found or expired.' });
      }
      return res.status(404).render('404', {
        shortId,
        baseUrl: `${req.protocol}://${req.get('host')}`,
        user: req.user || null,
      });
    }

    const destination = entry.originalUrl || entry.redirectUrl;
    return res.redirect(destination);
  } catch (error) {
    console.error('Redirection error:', error);
    return res.status(500).render('404', {
      shortId,
      baseUrl: `${req.protocol}://${req.get('host')}`,
      error: 'An internal server error occurred while redirecting.',
      user: req.user || null,
    });
  }
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).render('404', {
    shortId: null,
    baseUrl: `${req.protocol}://${req.get('host')}`,
    user: req.user || null,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
  });
});

// Start Server & Connect Database
connectToMongoDB(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 QuickLink is live on http://localhost:${PORT}`);
      console.log(`📡 Base URL configured: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB on startup:', err.message);
    app.listen(PORT, () => {
      console.log(`⚠️ Server running in degraded mode on http://localhost:${PORT} (MongoDB offline)`);
    });
  });

module.exports = app;