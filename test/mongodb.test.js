require('jest-specific-snapshot');

// Hide console.log
// global.console = {
//   log: jest.fn(),
//   // Keep native behaviour for other methods
//   error: console.error,
//   warn: console.warn,
//   info: console.info,
//   debug: console.debug,
// };

process.env.DIALECT = 'mongodb';

// Init app
require('./app.js');

require('./tests/model-getall.test.js');
require('./tests/model-query.test.js');

// Close mongoose connection
afterAll(async () => {
  const mongoose = require('mongoose');
  await mongoose.connection.close();
});