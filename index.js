const router = require('express').Router();
const jwt = require('jwt-simple');
const axios = require('axios');

class AdminMate {
  constructor({ projectId, secretKey }) {
    this.projectId = projectId;
    this.secretKey = secretKey;
  }

  accessControl(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  }

  request(method, url, params = {}, data = {}) {
    const token = jwt.encode({
      projectId: this.projectId,
      secretKey: this.secretKey
    }, this.secretKey);

    const request = axios({
      method: method,
      url: `http://localhost:3000${url}`,
      params,
      data,
      headers: {
        'project-id': this.projectId,
        'authorization': `bearer ${token}`
      }
    });

    return request;
  }

  createRoutes() {
    router.get('/adminmate/api/', async (req, res) => {
      const developers = await this.models[0].find().select('firstname lastname').limit(5).lean();
      res.json({ developers })
    });

    router.post('/adminmate/api/check_connection', async (req, res) => {
      const request = await this.request('POST', '/api/check_connection').catch(err => {
        console.log('===', err.response.status, err.response.data);
      });

      if (request) {
        console.log('==ok', request.response);
      }
      res.json({ message: 'ok' });
    });

    return router;
  }
}

module.exports = AdminMate;