const { getUser } = require('../service/auth');

/**
 * Middleware to check if user is authenticated without blocking guest requests.
 * Attaches user object to req.user and res.locals.user for EJS views.
 */
async function checkAuth(req, res, next) {
  const tokenCookie = req.cookies?.token;
  const authHeader = req.headers['authorization'];
  
  let token = tokenCookie;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  const user = getUser(token);
  req.user = user || null;
  res.locals.user = user || null;
  next();
}

/**
 * Middleware to restrict protected routes to authenticated users only.
 */
async function restrictToLoggedInUserOnly(req, res, next) {
  const tokenCookie = req.cookies?.token;
  const authHeader = req.headers['authorization'];
  
  let token = tokenCookie;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  const user = getUser(token);
  if (!user) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Please log in first.' });
    }
    return res.redirect('/login');
  }

  req.user = user;
  res.locals.user = user;
  next();
}

module.exports = {
  checkAuth,
  restrictToLoggedInUserOnly,
};
