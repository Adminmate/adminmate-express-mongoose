const jwt = require('jwt-simple');

module.exports.isAuthorized = (req, res, next) => {
  const token = req.headers['x-access-token'];

  let decoded;
  try {
    decoded = jwt.decode(token, global._amConfig.authKey);
  } catch(e) {
    return res.status(403).json({ code: 'not_authorized' });
  }

  if (!decoded || !decoded.exp_date) {
    return res.status(403).json({ code: 'not_authorized' });
  }
  else {
    // req.currentUser = decoded;
    next();
  }
};

module.exports.isAuthorizedIP = (req, res, next) => {
  if (global._amConfig.authorizedIps && global._amConfig.authorizedIps.length) {
    const currIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (global._amConfig.devMode === true || global._amConfig.authorizedIps.includes(currIp)) {
      return next();
    }
    res.status(403).json({ code: 'not_authorized_ip' });
  }
  else {
    next();
  }
};