const _ = require('lodash');
const fnHelper = require('../helpers/functions');

module.exports.getAutocomplete = async (req, res) => {
  const modelName = req.params.model;
  const search = (req.body.search || '').trim();
  const refFields = req.body.refFields;
  const maxItem = 10;

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel || !search) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const keys = fnHelper.getModelProperties(currentModel);
  const defaultFieldsToSearchIn = keys.filter(key => ['String'].includes(key.type)).map(key => key.path);
  const defaultFieldsToFetch = keys.filter(key => !key.path.includes('.')).map(key => key.path);

  const modelNameSafe = currentModel.collection.collectionName;
  const fieldsToSearchIn = refFields[modelNameSafe] ? refFields[modelNameSafe].split(' ') : defaultFieldsToSearchIn;
  const fieldsToFetch = refFields[modelNameSafe] ? refFields[modelNameSafe].split(' ') : defaultFieldsToFetch;
  const params = fnHelper.constructSearch(search, fieldsToSearchIn);

  console.log('====getAutocomplete', params['$or'], fieldsToFetch);

  const data = await currentModel
    .find(params)
    .select(fieldsToFetch)
    // .populate(fieldsToPopulate)
    // .sort(sortingFields)
    .limit(maxItem)
    .lean()
    .catch(e => {
      res.status(403).json({ message: e.message });
    });

  if (!data) {
    return res.status(403).json();
  }

  // Field to be used as the item's label
  const fieldsToDisplay = refFields[modelNameSafe] ? refFields[modelNameSafe] : '_id';

  let formattedData = [];
  if (data.length) {
    formattedData = data.map(d => {
      const label = fieldsToDisplay.replace(/[a-z._]+/gi, word => _.get(d, word));
      return { label, value: d._id };
    });
  }

  res.json({ data: formattedData });
};