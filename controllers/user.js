const User = require('../models/user');
const { setUser } = require('../service/auth');

/**
 * Handle user registration (Sign Up)
 */
async function handleUserSignup(req, res) {
  const { name, email, password } = req.body;
  const isJson = req.xhr || req.headers.accept?.includes('application/json') || req.is('json');

  try {
    if (!name || !email || !password) {
      const err = 'All fields (Name, Email, Password) are required.';
      if (isJson) return res.status(400).json({ success: false, error: err });
      return res.status(400).render('auth', { tab: 'signup', error: err, name, email });
    }

    if (password.length < 6) {
      const err = 'Password must be at least 6 characters long.';
      if (isJson) return res.status(400).json({ success: false, error: err });
      return res.status(400).render('auth', { tab: 'signup', error: err, name, email });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const err = 'An account with this email address already exists. Please sign in instead.';
      if (isJson) return res.status(409).json({ success: false, error: err });
      return res.status(409).render('auth', { tab: 'login', error: err, email: normalizedEmail });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
    });

    // Create session token and set cookie
    const token = setUser(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
    });

    if (isJson) {
      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Welcome to QuickLink.',
        user: { id: user._id, name: user.name, email: user.email },
      });
    }

    return res.redirect('/?welcome=true');
  } catch (error) {
    console.error('Signup Error:', error);
    const err = error.message || 'Registration failed. Please try again.';
    if (isJson) return res.status(500).json({ success: false, error: err });
    return res.status(500).render('auth', { tab: 'signup', error: err, name, email });
  }
}

/**
 * Handle user authentication (Sign In / Login)
 */
async function handleUserLogin(req, res) {
  const { email, password } = req.body;
  const isJson = req.xhr || req.headers.accept?.includes('application/json') || req.is('json');

  try {
    if (!email || !password) {
      const err = 'Please provide both email and password.';
      if (isJson) return res.status(400).json({ success: false, error: err });
      return res.status(400).render('auth', { tab: 'login', error: err, email });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const err = 'No account found with this email. Please check your credentials or sign up.';
      if (isJson) return res.status(401).json({ success: false, error: err });
      return res.status(401).render('auth', { tab: 'login', error: err, email });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = 'Incorrect password. Please try again.';
      if (isJson) return res.status(401).json({ success: false, error: err });
      return res.status(401).render('auth', { tab: 'login', error: err, email });
    }

    // Set token cookie
    const token = setUser(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
    });

    if (isJson) {
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully!',
        user: { id: user._id, name: user.name, email: user.email },
      });
    }

    return res.redirect('/');
  } catch (error) {
    console.error('Login Error:', error);
    const err = 'Login failed due to an unexpected error. Please try again.';
    if (isJson) return res.status(500).json({ success: false, error: err });
    return res.status(500).render('auth', { tab: 'login', error: err, email });
  }
}

/**
 * Handle user logout
 */
async function handleUserLogout(req, res) {
  res.clearCookie('token');
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, message: 'Logged out successfully.' });
  }
  return res.redirect('/login');
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
  handleUserLogout,
};