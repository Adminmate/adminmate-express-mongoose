const mongoose = require('mongoose');

const User = require('./models/user');
const Car = require('./models/car');
const Blocked = require('./models/blocked');

let memoryServer = null;

// Use MONGO_URL if provided, otherwise an in-memory MongoDB (mongodb-memory-server),
// and finally fallback to a local MongoDB instance.
const getUri = async () => {
  if (process.env.MONGO_URL) {
    return process.env.MONGO_URL;
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    return memoryServer.getUri('demo');
  }
  catch(e) {
    console.warn('mongodb-memory-server unavailable, falling back to mongodb://localhost:27017/demo', e && e.message);
    return 'mongodb://localhost:27017/demo';
  }
};

const connectDb = async () => {
  const uri = await getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  return {
    disconnect: async () => {
      await mongoose.disconnect();
      if (memoryServer) {
        await memoryServer.stop();
        memoryServer = null;
      }
    }
  };
};

const models = { User, Car, Blocked };

module.exports = { models, connectDb };
