const _ = require('lodash');
const fnHelper = require('../helpers/functions');

module.exports.getOne = async (req, res) => {
  const modelName = req.params.model;
  const modelItemId = req.params.id;
  const refFields = req.body.refFields || {};

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const keys = fnHelper.getModelProperties(currentModel);
  const defaultFieldsToFetch = keys.map(key => key.path);
  const fieldsToFetch = req.body.fields ? req.body.fields : defaultFieldsToFetch;

  // Build ref fields for the model (for mongoose population purpose)
  const fieldsToPopulate = fnHelper.getFieldsToPopulate(keys, fieldsToFetch, refFields);

  // Get model associations
  const modelAssociations = fnHelper.getModelAssociations(modelName)
    .map(ma => ({ slug: ma.slug, ref_field: ma.ref_field }));

  let data = await currentModel
    .findById(modelItemId)
    .select(fieldsToFetch)
    .populate(fieldsToPopulate)
    .lean()
    .catch(e => {
      res.status(403).json({ message: e.message });
    });

  if (!data) {
    return res.status(403).json();
  }

  data = fnHelper.refFields(data, fieldsToPopulate);

  res.json({
    data,
    linkedModels: modelAssociations
  });
};