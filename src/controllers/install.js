const axios = require('axios');
const crypto = require('crypto');

const requestLauncher = (method, relativeUrl, params = {}, data = {}) => {
  // Create request signature
  const hmac = crypto.createHmac('sha256', global._amConfig.secretKey);
  hmac.update(JSON.stringify(data));
  const signatureToCompareWith = hmac.digest('hex');

  const url = global._amConfig.devMode ? `http://localhost:3010${relativeUrl}` : `https://api.adminmate.app${relativeUrl}`;
  const request = axios({
    method,
    url,
    params,
    data,
    headers: {
      'Content-Type': 'application/json',
      'X-Project-Id': global._amConfig.projectId,
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
  if (global._amConfig.models && global._amConfig.models.length > 0) {
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