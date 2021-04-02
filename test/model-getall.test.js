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

// POST /models/users
describe('Testing POST /api/models/users', () => {
  it('Without access token', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/users');

    // Check response
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('not_authorized');
  });

  it('With access token', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/users')
      .set('x-access-token', adminToken);

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});

// POST /models/cars
describe('Testing POST /api/models/cars', () => {
  it('With access token', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars')
      .set('x-access-token', adminToken);

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('With "refFields" parameter', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars')
      .set('x-access-token', adminToken)
      .send({
        refFields: {
          users: 'firstname lastname'
        }
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('With "fields" parameter (name & manufacturer only)', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars')
      .set('x-access-token', adminToken)
      .send({
        fields: ['name', 'manufacturer']
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('With "page" parameter set to 2', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars')
      .set('x-access-token', adminToken)
      .send({
        page: 2
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('With a "search" parameter', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars')
      .set('x-access-token', adminToken)
      .send({
        fields: ['name'],
        search: 'Porsche 91'
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('With a "order" parameter', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars')
      .set('x-access-token', adminToken)
      .send({
        fields: ['name'],
        search: 'Porsche 91',
        order: [['name', 'ASC']]
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('With a "filters" parameter', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars')
      .set('x-access-token', adminToken)
      .send({
        fields: ['name', 'year'],
        search: 'Porsche',
        filters: {
          operator: 'or',
          list: [
            { field: 'year', operator: 'is', value: 1968 },
            { field: 'year', operator: 'is', value: 1969 }
          ]
        }
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('With a "segment" parameter', async () => {
    // Make request
    const response = await supertest(app)
      .post(prefix + '/models/cars')
      .set('x-access-token', adminToken)
      .send({
        fields: ['name', 'year'],
        segment: {
          type: 'code',
          data: 'ferrari'
        }
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });
});

// After all
afterAll(done => {
  done();
})