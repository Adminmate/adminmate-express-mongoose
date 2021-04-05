// Hide console.log
global.console = {
  log: jest.fn(),
  // Keep native behaviour for other methods
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

const supertest = require('supertest');
const jwt = require('jwt-simple');

// Include the app
const app = require('./app.js');

// Endpoint prefix
const prefix = '/adminmate/api';

// Generate the admin token
const adminToken = jwt.encode({
  exp_date: Date.now() + 1000
}, 'authkey_secret');

// Before all
beforeAll(done => {
  done();
});

describe('Testing POST /api/models/users/5cd5308e695db945d3cc81a1', () => {
  it('Simple get one route', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/users/5cd5308e695db945d3cc81a1')
      .set('x-access-token', adminToken);

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});

describe('Testing POST /api/models/cars/5cd5308e695db945d3cc81b1', () => {
  it('Simple get one route', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars/5cd5308e695db945d3cc81b1')
      .set('x-access-token', adminToken);

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});

// After all
afterAll(done => {
  done();
})