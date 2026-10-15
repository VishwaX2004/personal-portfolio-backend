import jwt from 'jsonwebtoken';

export const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized: admin access required' });
    }

    req.adminUser = decoded;
    next();

  } catch (error) {
    console.error('Admin middleware error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
