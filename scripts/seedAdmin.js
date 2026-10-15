import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import AdminUser from '../models/adminUser.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await AdminUser.findOne({ username: 'vishwaAdmin' });

    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      const hashedPassword = await bcryptjs.hash('2004@vish#69', 10);
      const adminUser = new AdminUser({
        username: 'vishwaAdmin',
        password: hashedPassword
      });
      await adminUser.save();
      console.log('Admin user created successfully');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
