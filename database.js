const mongoose = require('mongoose');

const User = require('./models/user');
const Car = require('./models/car');

const connectDb = () => {
  return mongoose.connect('mongodb://localhost:27017/node-express-mongodb-server', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

const models = { User, Car };

module.exports = { models, connectDb };