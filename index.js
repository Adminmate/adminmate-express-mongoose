const router = require('express').Router();
const axios = require('axios');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const jwt = require('jwt-simple');
const modelController = require('./src/controllers/model');
const fnHelper = require('./src/helpers/functions');
const { isAuthorized } = require('./src/middlewares/auth');

class AdminMate {
  constructor({ projectId, secretKey, authKey, masterPassword, models }) {
    this.projectId = projectId;
    this.secretKey = secretKey;
    this.authKey = authKey;
    this.masterPassword = masterPassword;
    this.models = models;
  }

  accessControl(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token');
    res.header('Access-Control-Allow-Credentials', true);
    next();
  }

  request(method, url, params = {}, data = {}) {
    // Create request signature
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(JSON.stringify(data));
    const signatureToCompareWith = hmac.digest('hex');

    const request = axios({
      method: method,
      url: `http://localhost:3000${url}`,
      params,
      data,
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Id': this.projectId,
        'Signature': signatureToCompareWith
        // 'Authorization': `bearer ${token}`
      }
    });

    return request;
  }

  createRoutes() {
    // router.get('/adminmate/api/', async (req, res) => {
    //   const developers = await this.models[0].find().select('firstname lastname').limit(5).lean();
    //   res.json({ developers })
    // });

    router.use(cookieParser());

    // Check if connection between servers is ok
    router.post('/adminmate/api/check_connection', async (req, res) => {
      const localhostUrl = req.body.localhostUrl;
      if (!localhostUrl) {
        return res.status(403).json({ message: 'Invalid request' });
      }

      const postData = {
        action: 'check_connection',
        localhostUrl
      };
      const request = await this.request('POST', '/api/check_connection', {}, postData).catch(err => {
        console.log('===', err.response.status, err.response.data);
        //res.status(403).json({ message: err.response.data.message });
      });

      if (request) {
        return res.json({});
      } else {
        return res.status(403).json({ message: 'Invalid request' });
      }
    });

    // Check if there is at least one mongoose model
    router.post('/adminmate/api/check_models', async (req, res) => {
      if (this.models && this.models.length > 0) {
        const request = await this.request('POST', '/api/check_models', {}, { action: 'check_models' }).catch(err => {
          console.log('===', err.response.status, err.response.data);
          //res.status(403).json({ message: err.response.data.message });
        });

        if (request) {
          return res.json({});
        } else {
          return res.status(403).json({ message: 'Invalid request' });
        }
      } else {
        return res.status(403).json({ message: 'Invalid request' });
      }
    });

    router.post('/adminmate/api/login', async (req, res) => {
      const { password } = req.body;
      if (!password) {
        return res.status(403).json({ message: 'Invalid request' });
      }
      setTimeout(() => {
        if (password !== this.masterPassword) {
          return res.status(403).json({ message: 'Invalid master password' });
        }
        // Generate the Admin token
        const expireDays = 7;
        const adminToken = jwt.encode({
          exp_date: Date.now() + (24 * expireDays * 1000)
        }, this.authKey);
        res.json({ admin_token: adminToken });
      }, 2000);
    });

    // Get models list
    router.get('/adminmate/api/model', isAuthorized(this.authKey), modelController.getModels(this.models));

    // Get model config
    router.get('/adminmate/api/model/:model/config', isAuthorized(this.authKey),  modelController.getModelConfig(this.models));

    router.post('/adminmate/api/model/:model', isAuthorized(this.authKey), async (req, res) => modelController.get(req, res, this.models));
    router.get('/adminmate/api/model/:model/:id', isAuthorized(this.authKey), async (req, res) => modelController.getOne(req, res, this.models));

    return router;
  }
}

module.exports = AdminMate;