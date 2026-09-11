module.exports = _conf => {
  const fnHelper = require('../helpers/functions')(_conf);

  const deleteSome = async (req, res) => {
    const modelName = req.params.model;
    const itemIds = req.body.ids;

    if (!Array.isArray(itemIds) || !itemIds.length) {
      return res.status(403).json({ message: 'Invalid request' });
    }

    const currentModel = fnHelper.getModelObject(modelName);
    if (!currentModel) {
      return res.status(403).json({ message: 'Invalid request' });
    }

    let deleteReq;
    try {
      deleteReq = await currentModel.deleteMany({ _id: { $in: itemIds } });
    }
    catch(e) {
      return res.status(403).json({ message: 'Unable to delete the model items' });
    }

    res.json({ deletedCount: deleteReq.deletedCount });
  };

  return deleteSome;
};
