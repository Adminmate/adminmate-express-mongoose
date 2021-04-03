const _ = require('lodash');
const fnHelper = require('../helpers/functions');

module.exports.getAll = async (req, res) => {
  const modelName = req.params.model;
  const segment = req.body.segment;
  const search = (req.body.search || '').trim();
  const filters = req.body.filters;
  const refFields = req.body.refFields;
  const page = parseInt(req.body.page || 1);
  const nbItemPerPage = 10;
  const defaultOrdering = [ ['_id', 'DESC'] ];
  const order = req.body.order || null;

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  // Ordering config
  const orderConfig = fnHelper.validateOrderStructure(order) ? order : defaultOrdering;
  const orderSafe = fnHelper.getCleanOrderStructure(orderConfig);

  const keys = fnHelper.getModelProperties(currentModel);
  const defaultFieldsToFetch = keys.filter(key => !key.path.includes('.')).map(key => key.path);
  const fieldsToFetch = req.body.fields || defaultFieldsToFetch;

  const defaultFieldsToSearchIn = keys.filter(key => ['String'].includes(key.type)).map(key => key.path);
  const fieldsToSearchIn = /*['email', 'firstname', 'lastname'] ||*/ defaultFieldsToSearchIn;

  // Build ref fields for the model (for mongoose population purpose)
  const fieldsToPopulate = fnHelper.getFieldsToPopulate(keys, fieldsToFetch, refFields);

  let params = {};

  // If there is a text search query
  if (search) {
    params = fnHelper.constructSearch(search, fieldsToSearchIn, fieldsToPopulate);
  }

  // Filters
  if (filters && filters.operator && filters.list && filters.list.length) {
    const filtersQuery = fnHelper.constructQuery(filters.list, filters.operator);
    if (filtersQuery) {
      params = { $and: [params, filtersQuery] };
    }
  }

  // Segments
  if (segment && segment.type === 'code') {
    const modelSegments = fnHelper.getModelSegments(modelName);
    if (modelSegments) {
      const matchingSegment = modelSegments.find(s => s.code === segment.data);
      if (matchingSegment) {
        params = { $and: [params, matchingSegment.query] };
      }
    }
  }

  const data = await currentModel
    .find(params)
    .select(fieldsToFetch)
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