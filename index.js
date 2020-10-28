const router = require('express').Router();
const cookieParser = require('cookie-parser');
const modelController = require('./src/controllers/model');
const authController = require('./src/controllers/auth');
const installController = require('./src/controllers/install');
const smartActionsController = require('./src/controllers/smartactions');
const { isAuthorized, isAuthorizedIP } = require('./src/middlewares/auth');

const accessControl = (req, res, next) => {
  const origin = global._amConfig.devMode ? 'http://localhost:3002' : 'https://my.adminmate.io';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token, X-Perm-Token');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  // res.header('Access-Control-Allow-Credentials', true);
  next();
};

const Adminmate = ({ projectId, secretKey, authKey, masterPassword, models, authorizedIps, devMode }) => {
  global._amConfig = {};
  global._amConfig.projectId = projectId;
  global._amConfig.secretKey = secretKey;
  global._amConfig.authKey = authKey;
  global._amConfig.masterPassword = masterPassword;
  global._amConfig.models = models;
  global._amConfig.authorizedIps = authorizedIps || null;
  global._amConfig.devMode = devMode || false;

  router.use(cookieParser());
  router.use(accessControl);

  // Installation checks
  router.post('/api/check_connection', installController.checkConnection);
  router.post('/api/check_models', installController.checkModels);

  // Login
  router.post('/api/login', isAuthorizedIP, authController.login);

  // Get models list
  router.get('/api/model', isAuthorizedIP, isAuthorized, modelController.getModels);

  // Get model config
  // router.get('/api/model/:model/config', isAuthorized,  modelController.getModelConfig);

  // Get available Smart Actions for the items list
  router.get('/api/model/:model/smartactions', isAuthorizedIP, isAuthorized, smartActionsController.get);

  // CRUD endpoints
  router.post('/api/model/:model', isAuthorizedIP, isAuthorized, modelController.get);
  router.post('/api/model/:model/autocomplete', isAuthorizedIP, isAuthorized, modelController.getAutocomplete);
  router.post('/api/model/:model/create', isAuthorizedIP, isAuthorized, modelController.postOne);
  router.post('/api/model/:model/:id', isAuthorizedIP, isAuthorized, modelController.getOne);
  router.put('/api/model/:model/:id', isAuthorizedIP, isAuthorized, modelController.putOne);
  router.delete('/api/model/:model', isAuthorizedIP, isAuthorized, modelController.deleteSome);

  // Custom query
  router.post('/api/query', isAuthorizedIP, isAuthorized, modelController.customQuery);

  return router;
};

module.exports = {
  init: Adminmate,
  isAuthorized,
};