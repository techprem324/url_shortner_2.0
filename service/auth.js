const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'quicklink_super_secure_jwt_secret_key_2026';

function setUser(user) {
  if (!user) return null;
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  setUser,
  getUser,
};
