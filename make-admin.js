const mongoose = require('mongoose');
const User = require('./server/models/User');
const config = require('./server/config/config');

const makeAdmin = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'admin@example.com' });
    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('User updated to admin role');
    } else {
      console.log('User not found');
    }

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
};

makeAdmin();
