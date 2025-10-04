require('dotenv').config();

const config = {
  development: {
    port: process.env.PORT || 3000,
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb+srv://cinte:210203chinH@cluster0.dlnakyb.mongodb.net/dailyreport?retryWrites=true&w=majority&appName=Cluster0'
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRE || '7d'
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
    }
  },
  production: {
    port: process.env.PORT || 3000,
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb+srv://cinte:210203chinH@cluster0.dlnakyb.mongodb.net/dailyreport?retryWrites=true&w=majority&appName=Cluster0'
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
    }
  },
  test: {
    port: process.env.PORT || 3000,
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb+srv://cinte:210203chinH@cluster0.dlnakyb.mongodb.net/dailyreport_test?retryWrites=true&w=majority&appName=Cluster0'
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'test-secret',
      expiresIn: '1d'
    },
    bcrypt: {
      rounds: 10
    }
  }
};

const env = process.env.NODE_ENV || 'development';

module.exports = config[env];
