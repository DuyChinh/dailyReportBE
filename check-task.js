const mongoose = require('mongoose');
const Task = require('./server/models/Task');
const config = require('./server/config/config');

const checkTask = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    const task = await Task.findById('68e11dc778ab1cca593b40ef');
    console.log('Task found:', task);

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
};

checkTask();
