module.exports = _conf => {
  const fnHelper = require('../helpers/functions')(_conf);

  const postOne = async (req, res) => {
    const modelName = req.params.model;
    const data = req.body.data;

    const currentModel = fnHelper.getModelObject(modelName);
    if (!currentModel) {
      return res.status(403).json({ message: 'Invalid request' });
    }

    const newItem = new currentModel(data);
    const newSavedItem = await newItem.save().catch(e => {
      const errorObject = fnHelper.buildError(e, 'An error occured when saving the item');
      res.status(403).json(errorObject);
    });

    if (newSavedItem) {
      res.json({
        data: {
          id: newSavedItem._id // id and not _id to be generic
        }
      });
    }
  };

  return postOne;
};
