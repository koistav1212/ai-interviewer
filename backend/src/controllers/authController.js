const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields (name, email, password, role) are required' });
    }

    const normalizedRole = role.toUpperCase();
    if (!['ADMIN', 'RECRUITER', 'CANDIDATE'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of ADMIN, RECRUITER, CANDIDATE' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email address already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: normalizedRole,
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('id name email role createdAt');
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
