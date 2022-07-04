module.exports = _conf => {
  const fnHelper = require('../helpers/functions')(_conf);

  const getRefs = async (req, res) => {
    const modelName = req.params.model;
    const ids = req.query.ids;
    const refFields = req.headers['am-ref-fields'] || {};
    const nbItemPerPage = 20;

    if (!ids) {
      return res.status(403).json({ message: 'Missing parameter ids' });
    }

    const fieldsToFetchSafe = refFields[modelName];

    // If no ref fields, return default response
    if (!fieldsToFetchSafe) {
      return res.json({
        data: ids.map(id => ({ value: id, label: id }))
      });
    }

    const currentModel = fnHelper.getModelObject(modelName);
    if (!currentModel) {
      return res.status(403).json({ message: 'Invalid request' });
    }

    // Find parameters
    const findParams = { _id: ids };

    const data = await currentModel
      .find(findParams)
      .select(fieldsToFetchSafe)
      .limit(nbItemPerPage)
      .lean()
      .catch(e => {
        res.status(403).json({ message: e.message });
      });

    if (!data) {
      return res.status(403).json();
    }

    // Format the response
    const formattedData = ids.map(_id => {
      const match = data.find(d => d._id.toString() === _id.toString());
      const label = match ? fnHelper.fieldsToValues(fieldsToFetchSafe, match) : _id;
      return { value: _id, label };
    });

    res.json({
      data: formattedData
    });
  };

  return getRefs;
};
