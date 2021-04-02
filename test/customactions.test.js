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

// Custom actions
describe('Testing GET /api/models/customactions', () => {
  it('should return a 403 http response', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/customactions');

    // Check response
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('not_authorized');
  });

  it('should return a 200 http response', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/customactions')
      .set('x-access-token', adminToken);

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});

// Custom actions
describe('Testing GET /api/models/:model/customactions', () => {
  it('should return a 403 http response', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/users/customactions');

    // Check response
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('not_authorized');
  });

  it('should return a 403 http response', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/users/customactions')
      .set('x-access-token', adminToken)
      .query({ ids: [], target: '' })

    // Check response
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Invalid request');
  });

  it('should return a 200 http response', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/users/customactions')
      .set('x-access-token', adminToken)
      .query({ ids: [9], target: 'item' })

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});

// After all
afterAll(done => {
  done();
})