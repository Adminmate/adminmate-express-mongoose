const { intersection } = require('lodash');

module.exports = _conf => {
  const fnHelper = require('../helpers/functions')(_conf);

  const getAll = async (req, res) => {
    const modelName = req.params.model;
    const segment = req.query.segment;
    const search = (req.query.search || '').trim();
    const filters = req.query.filters;
    const fieldsToFetch = req.headers['am-model-fields'] || [];
    const refFields = req.headers['am-ref-fields'] || {};
    const inlineActions = req.headers['am-inline-actions'] || [];
    const fieldsToSearchIn = req.query.search_in_fields || [];
    const page = parseInt(req.query.page || 1);
    const nbItemPerPage = 10;
    const defaultOrdering = [ ['_id', 'DESC'] ];
    const order = req.query.order || null;

    const currentModel = fnHelper.getModelObject(modelName);
    if (!currentModel) {
      return res.status(403).json({ message: 'Invalid request' });
    }

    // Model actions
    const currentModelActions = fnHelper.getModelActions(modelName);

    // Get model properties
    const keys = fnHelper.getModelProperties(currentModel);

    // Ordering config
    const orderConfig = fnHelper.validateOrderStructure(order) ? order : defaultOrdering;
    const orderSafe = fnHelper.getCleanOrderStructure(orderConfig);

    // Construct default fields to fetch
    let fieldsToFetchSafe = keys
      .filter(key => !key.path.includes('.'))
      .map(key => key.path);

    // If we get specific fields to display
    if (Array.isArray(fieldsToFetch) && fieldsToFetch.length > 0) {
      const flatKeys = keys.map(key => key.path);
      const validKeys = intersection(fieldsToFetch, flatKeys);
      if (validKeys.length > 0) {
        fieldsToFetchSafe = validKeys;
      }
    }

    // Construct default fields to search in (only String type)
    const defaultFieldsToSearchIn = keys
      .filter(key => ['String'].includes(key.type))
      .map(key => key.path);
    const fieldsToSearchInSafe = Array.isArray(fieldsToSearchIn) && fieldsToSearchIn.length ? fieldsToSearchIn : defaultFieldsToSearchIn;

    // Build ref fields for the model (for mongoose population purpose)
    const fieldsToPopulate = fnHelper.getFieldsToPopulate(keys, fieldsToFetchSafe, refFields);

    const queriesArray = [];

    // Search -----------------------------------------------------------------------------

    if (search) {
      const searchQuery = fnHelper.constructSearch(search, fieldsToSearchInSafe, fieldsToPopulate);
      queriesArray.push(searchQuery);
    }

    // Filters ----------------------------------------------------------------------------

    if (filters) {
      const filtersQuery = fnHelper.constructQuery(filters);
      if (filtersQuery) {
        queriesArray.push(filtersQuery);
      }
    }

    // Segments ---------------------------------------------------------------------------

    if (segment && segment.type === 'code' && segment.data) {
      const modelSegment = fnHelper.getModelSegment(modelName, segment.data);
      if (modelSegment) {
        queriesArray.push(modelSegment.query);
      }
    }

    const findParams = queriesArray.length ? { $and: queriesArray } : {};

    const data = await currentModel
      .find(findParams)
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

    const dataCount = await currentModel.countDocuments(findParams);
    const nbPage = Math.ceil(dataCount / nbItemPerPage);

    // Make ref fields appeared as link in the dashboard
    const formattedData = data.map(item => {
      return fnHelper.refFields(item, fieldsToPopulate);
    });

    // Inline actions button
    const _inlineActions = currentModelActions.filter(action => inlineActions.includes(action.code));
    if (_inlineActions.length) {
      formattedData.forEach(item => {
        item._am_inline_actions = _inlineActions
          .filter(action => typeof action.filter === 'undefined' || action.filter(item))
          .map(action => action.code);
      })
    }

    res.json({
      data: formattedData,
      count: dataCount,
      pagination: {
        current: page,
        count: nbPage
      }
    });
  };

  return getAll;
};
