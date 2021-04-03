const _ = require('lodash');
const fnHelper = require('../helpers/functions');

module.exports.deleteSome = async (req, res) => {
  const modelName = req.params.model;
  const itemIds = req.body.ids;

  if (!itemIds || !itemIds.length) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const deleteReq = await currentModel.deleteMany({ _id: { $in: itemIds }})
    .catch(e => {
      res.status(403).json({ message: 'Unable to delete the model items' });
    });

  res.json({ deletedCount: deleteReq.deletedCount });
};