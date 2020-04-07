const router = require('express').Router();
const axios = require('axios');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const modelController = require('./src/controllers/model');

const getModelProperties = (model) => {
  let modelFields = [];
  const modelProps = model.schema.paths;

  Object.keys(modelProps).forEach(key => {
    if (key === '__v') {
      return;
    }
    let property = {
      path: key,
      type: modelProps[key].instance
    };

    if (modelProps[key].enumValues && modelProps[key].enumValues.length) {
      property.enum = modelProps[key].enumValues;
    }
    if (modelProps[key].options.default) {
      property.default = modelProps[key].options.default;
    }
    if (modelProps[key].options.ref) {
      property.ref = modelProps[key].options.ref;
    }

    modelFields.push(property);
  });

  return modelFields;
};

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
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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

    router.get('/adminmate/api/model', async (req, res) => {
      let models = [];
      this.models.forEach(model => {
        models.push(model.collection.name);
      });
      res.json({ models });
    });

    router.get('/adminmate/api/model/:model/config', async (req, res) => {
      const currentModel = this.models.find(m => m.collection.name === req.params.model);
      if (!currentModel) {
        return res.status(403).json({ message: 'Invalid request' });
      }
      const keys = getModelProperties(currentModel);
      res.json({ keys });
    });

    router.get('/adminmate/api/model/:model', async (req, res) => modelController.get(req, res, this.models));

    return router;
  }
}

module.exports = AdminMate;