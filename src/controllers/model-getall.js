const _ = require('lodash');
const fnHelper = require('../helpers/functions');

module.exports.getAll = async (req, res) => {
  const modelName = req.params.model;
  const segment = req.body.segment;
  const search = (req.body.search || '').trim();
  const filters = req.body.filters;
  const fieldsToFetch = req.body.fields || [];
  const refFields = req.body.refFields;
  const fieldsToSearchIn = req.body.fieldsToSearchIn || [];
  const page = parseInt(req.body.page || 1);
  const nbItemPerPage = 10;
  const defaultOrdering = [ ['_id', 'DESC'] ];
  const order = req.body.order || null;

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  // Get model properties
  const keys = fnHelper.getModelProperties(currentModel);

  // Ordering config
  const orderConfig = fnHelper.validateOrderStructure(order) ? order : defaultOrdering;
  const orderSafe = fnHelper.getCleanOrderStructure(orderConfig);

  // Construct default fields to fetch
  const defaultFieldsToFetch = keys
    .filter(key => !key.path.includes('.'))
    .map(key => key.path);
  const fieldsToFetchSafe = Array.isArray(fieldsToFetch) && fieldsToFetch.length ? fieldsToFetch : defaultFieldsToFetch;

  // Construct default fields to search in (only String type)
  const defaultFieldsToSearchIn = keys
    .filter(key => ['String'].includes(key.type))
    .map(key => key.path);
  const fieldsToSearchInSafe = Array.isArray(fieldsToSearchIn) && fieldsToSearchIn.length ? fieldsToSearchIn : defaultFieldsToSearchIn;

  // Build ref fields for the model (for mongoose population purpose)
  const fieldsToPopulate = fnHelper.getFieldsToPopulate(keys, fieldsToFetch, refFields);

  let params = { $and: [] };

  // Search -----------------------------------------------------------------------------

  if (search) {
    const searchQuery = fnHelper.constructSearch(search, fieldsToSearchInSafe, fieldsToPopulate);
    params.$and.push(searchQuery);
  }

  // Filters ----------------------------------------------------------------------------

  if (filters) {
    const filtersQuery = fnHelper.constructQuery(filters);
    if (filtersQuery) {
      params.$and.push(filtersQuery);
    }
  }

  // Segments ---------------------------------------------------------------------------

  if (segment && segment.type === 'code' && segment.data) {
    const modelSegment = fnHelper.getModelSegment(modelName, segment.data);
    if (modelSegment) {
      params.$and.push(modelSegment.query);
    }
  }

  const data = await currentModel
    .find(params)
    .select(fieldsToFetchSafe)
    .populate(fieldsToPopulate)
    .sort(orderSafe)
    .skip(nbItemPerPage * (page - 1))
    .limit(nbItemPerPage)
    .lean()
    .catch(e => {
      res.status(403).json({ message: e.message });
    });

  if (!data) {
    return res.status(403).json();
  }

  const dataCount = await currentModel.countDocuments(params);
  const nbPage = Math.ceil(dataCount / nbItemPerPage);

  // Make ref fields appeared as link in the dashboard
  const formattedData = data.map(item => {
    return fnHelper.refFields(item, fieldsToPopulate);
  });

  res.json({
    data: formattedData,
    count: dataCount,
    pagination: {
      current: page,
      count: nbPage
    }
  });
};