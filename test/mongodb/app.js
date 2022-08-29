'use strict';

// Connect to database
const { models } = require('./database');

// Init
const amConfig = {
  projectId: '6037b459cbb0f63c219789eb',
  secretKey: '7dn6m0zrcsqta5b57hug52xlira4upqdempch65mwy5guehr33vt0r1s8cyrnmko',
  authKey: 'authkey_secret',
  masterPassword: 'demo-password',
  devMode: true, // If you want to use the dev version of @adminmate-express-core
  testMode: true, // If you want the Adminmate init to return the api instead of the express js router (for tests purpose)
  models: [
    {
      slug: 'users',
      model: models.User,
      actions: []
    },
    {
      slug: 'cars',
      model: models.Car,
      actions: [
        {
          label: 'Block the car',
          code: 'block_car',
          target: ['item'],
          filter: car => {
            return car.year === 1960
          }
        }
      ],
      segments: [
        {
          label: 'Ferrari',
          code: 'ferrari',
          query: {
            name: { $regex: 'erra', $options: 'i' }
          }
        }
      ]
    }
  ]
};

module.exports = require('../../index.js').init(amConfig);
