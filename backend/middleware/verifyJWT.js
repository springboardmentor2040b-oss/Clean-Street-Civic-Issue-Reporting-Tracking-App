const jwt = require('jsonwebtoken');

// Middleware to verify JWT
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure required fields are present in req.user
    req.user = {
      _id: decoded.id,
      username: decoded.username || 'Unknown',
      name: decoded.name || '',
      avatar: decoded.avatar || '',
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyJWT;