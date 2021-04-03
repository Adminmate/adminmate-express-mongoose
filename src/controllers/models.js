const _ = require('lodash');
const fnHelper = require('../helpers/functions');

module.exports.getModelsProperties = (req, res) => {
  const modelsProperties = [];

  global._amConfig.models.forEach(modelConfig => {
    const modelProperties = fnHelper.getModelProperties(modelConfig.model);
    modelProperties.map(property => {
      modelsProperties.push({
        model: modelConfig.slug,
        path: property.path
      });
    });
  });

  res.json({ properties: modelsProperties });
};

module.exports.getModels = (req, res) => {
  let models = [];

  global._amConfig.models.forEach(modelConfig => {
    const modelObject = {
      slug: modelConfig.slug,
      properties: fnHelper.getModelProperties(modelConfig.model),
      customactions: [],
      segments: []
    };

    // Add custom actions if present
    if (modelConfig.customActions) {
      modelObject.customactions = modelConfig.customActions;
    }

    // Add segments if present
    if (modelConfig.segments) {
      modelObject.segments = modelConfig.segments.map(segment => ({ label: segment.label, code: segment.code }));
    }

    models.push(modelObject);
  });

  res.json({ models });
};
