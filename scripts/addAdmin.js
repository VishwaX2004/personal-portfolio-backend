import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import AdminUser from '../models/adminUser.js';

dotenv.config();

const addAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // New admin credentials
    const username = 'admin';
    const password = '19701127Chabi@119';

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ username });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new admin user
    const newAdmin = new AdminUser({
      username,
      password: hashedPassword
    });

    await newAdmin.save();
    console.log(`✅ Admin user '${username}' created successfully with encrypted password`);
    console.log(`Admin ID: ${newAdmin._id}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error adding admin:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

addAdmin();
