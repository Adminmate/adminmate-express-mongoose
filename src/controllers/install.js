const axios = require('axios');
const crypto = require('crypto');

const requestLauncher = (method, url, params = {}, data = {}) => {
  // Create request signature
  const hmac = crypto.createHmac('sha256', global._config.secretKey);
  hmac.update(JSON.stringify(data));
  const signatureToCompareWith = hmac.digest('hex');

  const request = axios({
    method: method,
    url: `http://localhost:3000${url}`,
    params,
    data,
    headers: {
      'Content-Type': 'application/json',
      'X-Project-Id': global._config.projectId,
      'Signature': signatureToCompareWith
      // 'Authorization': `bearer ${token}`
    }
  });

  return request;
};

module.exports.checkConnection = async (req, res) => {
  const localhostUrl = req.body.localhostUrl;
  if (!localhostUrl) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const postData = {
    action: 'check_connection',
    localhostUrl
  };
  const request = await requestLauncher('POST', '/api/check_connection', {}, postData).catch(err => {
    console.log('===', err.response.status, err.response.data);
    //res.status(403).json({ message: err.response.data.message });
  });

  if (request) {
    return res.json({});
  } else {
    return res.status(403).json({ message: 'Invalid request' });
  }
};

module.exports.checkModels = async (req, res) => {
  if (global._config.models && global._config.models.length > 0) {
    const request = await requestLauncher('POST', '/api/check_models', {}, { action: 'check_models' }).catch(err => {
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
};