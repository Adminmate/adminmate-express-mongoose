const router = require('express').Router();

class AdminMate {
  constructor({ authKey, models }) {
    this.authKey = authKey;
    this.models = models;

    return this.createRoutes();
  }

  createRoutes() {
    router.get('/', async (req, res) => {
      const developers = await this.models[0].find().select('firstname lastname').limit(5).lean();
      res.json({ developers })
    });

    return router;
  }
}

module.exports = AdminMate;