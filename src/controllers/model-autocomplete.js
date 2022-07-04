const _ = require('lodash');

module.exports = _conf => {
  const fnHelper = require('../helpers/functions')(_conf);

  const getAutocomplete = async (req, res) => {
    const modelName = req.params.model;
    const search = (req.query.s || '').trim();
    const refFields = req.headers['am-ref-fields'] || {};
    const maxItem = 10;

    const currentModel = fnHelper.getModelObject(modelName);
    if (!currentModel || !search) {
      return res.status(403).json({ message: 'Invalid request' });
    }

    const keys = fnHelper.getModelProperties(currentModel);
    const defaultFieldsToSearchIn = keys.filter(key => ['String'].includes(key.type)).map(key => key.path);
    const defaultFieldsToFetch = keys.filter(key => !key.path.includes('.')).map(key => key.path);

    const fieldsToSearchIn = refFields[modelName] ? refFields[modelName].split(' ') : defaultFieldsToSearchIn;
    const fieldsToFetch = refFields[modelName] ? refFields[modelName].split(' ') : defaultFieldsToFetch;
    const params = fnHelper.constructSearch(search, fieldsToSearchIn);

    const data = await currentModel
      .find(params)
      .select(fieldsToFetch)
      // .sort()
      .limit(maxItem)
      .lean()
      .catch(e => {
        res.status(403).json({ message: e.message });
      });

    if (!data) {
      return res.status(403).json();
    }

    let formattedData = [];
    if (data.length) {
      // Field to be used for the item label
      const fieldsToDisplay = refFields[modelName] ? refFields[modelName] : '_id';
      formattedData = data.map(d => {
        const label = fieldsToDisplay.replace(/[a-z._]+/gi, word => _.get(d, word));
        return { label, value: d._id };
      });
    }

    res.json({ data: formattedData });
  };

  return getAutocomplete;
};
