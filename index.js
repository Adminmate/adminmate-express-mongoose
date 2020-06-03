const router = require('express').Router();
const cookieParser = require('cookie-parser');
const modelController = require('./src/controllers/model');
const authController = require('./src/controllers/auth');
const installController = require('./src/controllers/install');
const { isAuthorized } = require('./src/middlewares/auth');

class AdminMate {
  constructor({ projectId, secretKey, authKey, masterPassword, models }) {
    global._config = {};
    global._config.projectId = projectId;
    global._config.secretKey = secretKey;
    global._config.authKey = authKey;
    global._config.masterPassword = masterPassword;
    global._config.models = models;
  }

  accessControl(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', true);
    next();
  }

  createRoutes() {
    router.use(cookieParser());

    // Installation checks
    router.post('/adminmate/api/check_connection', installController.checkConnection);
    router.post('/adminmate/api/check_models', installController.checkModels);

    // Login
    router.post('/adminmate/api/login', authController.login);

    // Get models list
    router.get('/adminmate/api/model', isAuthorized, modelController.getModels);

    // Get model config
    // router.get('/adminmate/api/model/:model/config', isAuthorized,  modelController.getModelConfig);

    // CRUD endpoints
    router.post('/adminmate/api/model/:model', isAuthorized, modelController.get);
    router.get('/adminmate/api/model/:model/:id', isAuthorized, modelController.getOne);
    router.put('/adminmate/api/model/:model/:id', isAuthorized, modelController.putOne);

    // Custom query
    router.post('/adminmate/api/query', isAuthorized, modelController.customQuery);

    return router;
  }
}

module.exports = AdminMate;