const fnHelper = require('../helpers/functions');

module.exports.getIn = async (modelName, ids) => {
  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return null;
  }

  // Get corresponding items
  const items = await currentModel
    .find({ _id: { $in: ids } })
    .lean();

  return items;
};