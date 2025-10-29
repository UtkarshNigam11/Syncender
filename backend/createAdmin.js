const mongoose = require('mongoose');
const readline = require('readline');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get admin details from user
    console.log('\n📝 Create Admin Account\n');
    
    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await question('Admin Password (min 6 characters): ');

    if (!name || !email || !password) {
      console.log('❌ All fields are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('❌ Admin user with this email already exists');
        process.exit(1);
      }
      
      // Update existing user to admin
      existingUser.role = 'admin';
      existingUser.isActive = true;
      await existingUser.save();
      console.log(`✅ User ${email} has been upgraded to admin`);
    } else {
      // Create new admin user
      const admin = new User({
        name,
        email,
        password,
        role: 'admin',
        isActive: true
      });

      await admin.save();
      console.log(`✅ Admin user created successfully!`);
    }

    console.log('\n🎉 Admin Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔗 Login at: http://localhost:3000/admin/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
