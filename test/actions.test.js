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

// Generate the perm token
const permToken = jwt.encode({
  exp_date: Date.now() + 1000,
  data: {
    authorized_models: ['*']
  }
}, '7dn6m0zrcsqta5b57hug52xlira4upqdempch65mwy5guehr33vt0r1s8cyrnmko');

// Generate the users perm token
const ModelPermToken_Users = jwt.encode({
  exp_date: Date.now() + 1000,
  data: {
    model: 'users',
    can_create: true,
    can_update: ['*'],
    can_delete: true,
    can_configure: true,
    can_use_actions: ['*'],
    can_use_segments: ['*']
  }
}, '7dn6m0zrcsqta5b57hug52xlira4upqdempch65mwy5guehr33vt0r1s8cyrnmko');

// Generate the users perm token
const ModelPermToken_Cars = jwt.encode({
  exp_date: Date.now() + 1000,
  data: {
    model: 'cars',
    can_create: true,
    can_update: ['*'],
    can_delete: true,
    can_configure: true,
    can_use_actions: ['*'],
    can_use_segments: ['*']
  }
}, '7dn6m0zrcsqta5b57hug52xlira4upqdempch65mwy5guehr33vt0r1s8cyrnmko');

// Before all
beforeAll(done => {
  done();
});

// Actions
describe('Testing GET /api/models/:model/actions', () => {
  it('should return a 403 http response', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/users/actions');

    // Check response
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('not_authorized');
  });

  it('should return a 403 http response', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/users/actions')
      .set('x-access-token', adminToken)
      .set('x-perm-token', permToken)
      .query({ ids: [], target: '' })

    // Check response
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Invalid request');
  });

  it('should return a 200 http response for users', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/users/actions')
      .set('x-access-token', adminToken)
      .set('x-perm-token', permToken)
      .set('x-model-perm-token', ModelPermToken_Users)
      .query({
        ids: '9',
        target: 'item'
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('should return a 200 http response for cars', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/cars/actions')
      .set('x-access-token', adminToken)
      .set('x-perm-token', permToken)
      .set('x-model-perm-token', ModelPermToken_Cars)
      .query({
        ids: '5cd5308e695db945d3cc81c5,5cd5308e695db945d3cc81c6,5cd5308e695db945d3cc81c7',
        target: 'bulk'
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('should return a 200 http response for cars-bulk', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/cars/actions')
      .set('x-access-token', adminToken)
      .set('x-perm-token', permToken)
      .set('x-model-perm-token', ModelPermToken_Cars)
      .query({
        ids: '5cd5308e695db945d3cc81c6',
        target: 'bulk'
      });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body).toMatchSnapshot();
  });

  it('should return a 200 http response for cars-item', async () => {
    // Make request
    const response = await supertest(app)
      .get(prefix + '/models/cars/actions')
      .set('x-access-token', adminToken)
      .set('x-perm-token', permToken)
      .set('x-model-perm-token', ModelPermToken_Cars)
      .query({
        ids: '5cd5308e695db945d3cc81c6',
        target: 'item'
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