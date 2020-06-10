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