'use strict';

const express = require('express');

// If you want to use the dev version of @adminmate-express-core
global.AM_DEV_MODE = true;

// Create express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// Connect to database
const { models, connectDb } = require('../database');
connectDb().then(async () => {
  console.log('MongoDB connected');
});

// Init
const amConfig = {
  projectId: '6037b459cbb0f63c219789eb',
  secretKey: '7dn6m0zrcsqta5b57hug52xlira4upqdempch65mwy5guehr33vt0r1s8cyrnmko',
  authKey: 'authkey_secret',
  masterPassword: 'demo-password',
  models: [
    {
      slug: 'users',
      model: models.User,
      customActions: []
    },
    {
      slug: 'cars',
      model: models.Car,
      customActions: [
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

const plugin = require('../index.js');
app.use('/adminmate', plugin.init(amConfig));
// app.use('/adminmate/customactions', require('./server/routes/adminmate_ca'));
// app.use('/adminmate/custom_api', require('./server/routes/custom_api'));

module.exports = app;