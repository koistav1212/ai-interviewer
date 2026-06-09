const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User associated with token no longer exists' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'JWT token has expired' });
    }
    return res.status(401).json({ message: 'Invalid JWT signature' });
  }
};
