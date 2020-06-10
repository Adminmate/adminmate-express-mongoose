const jwt = require('jwt-simple');

module.exports.login = async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(403).json({ message: 'Invalid request' });
  }
  setTimeout(() => {
    if (password !== global._amConfig.masterPassword) {
      return res.status(403).json({ message: 'Invalid master password' });
    }
    // Generate the Admin token
    const expireDays = 7;
    const adminToken = jwt.encode({
      exp_date: Date.now() + (24 * expireDays * 1000)
    }, global._amConfig.authKey);
    res.json({ admin_token: adminToken });
  }, 2000);
};