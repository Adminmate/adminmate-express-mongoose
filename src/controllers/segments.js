const fnHelper = require('../helpers/functions');

module.exports.getAll = async (req, res) => {
  const list = [];

  global._amConfig.models.forEach(model => {
    const currentModel = typeof model === 'function' ? model : model.model;
    const modelName = currentModel.collection.name;
    const currentModelSegments = fnHelper.getModelSegments(modelName);
    if (currentModelSegments && currentModelSegments.length) {
      currentModelSegments.map(sa => {
        list.push({
          model: modelName,
          label: sa.label,
          code: sa.code
        });
      });
    }
  });

  res.json({ list });
};