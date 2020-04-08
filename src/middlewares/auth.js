const jwt = require('jwt-simple');

module.exports.isAuthorized = authKey => {
  return (req, res, next) => {
    const token = req.headers['x-access-token'];
    const decoded = jwt.decode(token, authKey);

    if (!decoded || !decoded.exp_date) {
      return res.status(403).json({ code: 'not_authorized' });
    }
    else {
      // req.currentUser = decoded;
      next();
    }
  }
};