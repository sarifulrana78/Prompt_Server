const { auth } = require('../auth');
const User = require('../models/User');

const verifyAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
    }
    
    // We attach the user to the request object
    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { verifyAuth, verifyRole };
