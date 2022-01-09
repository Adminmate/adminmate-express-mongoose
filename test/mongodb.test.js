require('jest-specific-snapshot');

const { models, connectDb } = require('./database');

let mongooseConnection;
beforeAll(async () => {
  mongooseConnection = await connectDb();
  await Promise.all([
    models.User.deleteMany({}),
    models.Car.deleteMany({}),
    models.Blocked.deleteMany({})
  ]);
  await models.User.insertMany(require('./data/users.js'));
  await models.Car.insertMany(require('./data/cars.js'));
  await models.Blocked.insertMany(require('./data/blocked.js'));
});

// Init app
require('./app.js');

require('./tests/model-getall.test.js');
require('./tests/model-query.test.js');

// Close mongoose connection
afterAll(async () => {
  mongooseConnection.disconnect();
});