require('jest-specific-snapshot');

const { models, connectDb } = require('./mongodb/database');

let mongooseConnection;
beforeAll(async () => {
  mongooseConnection = await connectDb();
  await Promise.all([
    models.User.deleteMany({}),
    models.Car.deleteMany({}),
    models.Blocked.deleteMany({})
  ]);
  await models.User.insertMany(require('./mongodb/data/users.js'));
  await models.Car.insertMany(require('./mongodb/data/cars.js'));
  await models.Blocked.insertMany(require('./mongodb/data/blocked.js'));
});

// Init app
require('./mongodb/app.js');

require('./mongodb/tests/model-getall.test.js');
require('./mongodb/tests/model-query.test.js');

// Close mongoose connection
afterAll(async () => {
  mongooseConnection.disconnect();
});