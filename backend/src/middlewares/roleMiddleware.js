module.exports = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRole = String(req.user.role || '').toUpperCase();
    const allowed = allowedRoles.map(role => String(role).toUpperCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied: Insufficient privileges' });
    }
    next();
  };
};
