import jwt from 'jsonwebtoken';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token is invalid or expired.' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(410).json({ message: 'Authorization header is missing.' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient privileges.' });
    }

    next();
  };
};
