const fnHelper = require('../helpers/functions');

module.exports.getAll = async (req, res) => {
  const list = [];

  global._amConfig.models.forEach(modelConfig => {
    const currentModelSegments = fnHelper.getModelSegments(modelConfig.slug);
    if (currentModelSegments && currentModelSegments.length) {
      currentModelSegments.map(sa => {
        list.push({
          model: modelConfig.slug,
          label: sa.label,
          code: sa.code
        });
      });
    }
  });

  res.json({ list });
};