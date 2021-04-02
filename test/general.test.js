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

// Before all
beforeAll(done => {
  done();
});

// check_connection
describe('Testing POST /api/check_connection', () => {
  it('should return a 403 http response', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/check_connection')
      .send({
        // data: ''
      });

    // Check response
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Invalid request');
  });
});

// login
describe('Testing POST /api/login', () => {
  it('should return a 403 http response', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/login')
      .send({
        // data: ''
      });

    // Check response
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Invalid request');
  });
});

// After all
afterAll(done => {
  done();
})