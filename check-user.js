const mongoose = require('mongoose');
const User = require('./server/models/User');
const config = require('./server/config/config');

const checkUser = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    const user = await User.findById('68e0e4515bb27c55849e131a');
    console.log('User found:', user);

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
};

checkUser();
