import AdminUser from '../models/adminUser.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const adminUser = await AdminUser.findOne({ username });

    if (!adminUser) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcryptjs.compare(password, adminUser.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: adminUser._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      token,
      username: adminUser.username,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
