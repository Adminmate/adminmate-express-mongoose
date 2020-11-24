const mongoose = require('mongoose');
const fnHelper = require('../helpers/functions');

module.exports.getModels = (req, res) => {
  let models = [];
  global._amConfig.models.forEach(model => {
    const currentModel = typeof model === 'function' ? model : model.model;
    const modelObject = {
      name: currentModel.collection.name,
      properties: fnHelper.getModelProperties(currentModel),
      smartActions: [],
      segments: []
    };

    // Add smart actions if present
    if (typeof model !== 'function' && model.smartActions) {
      modelObject.smartActions = model.smartActions;
    }

    // Add smart actions if present
    if (typeof model !== 'function' && model.segments) {
      modelObject.segments = model.segments.map(segment => segment.code);
    }

    models.push(modelObject);
  });
  res.json({ models });
};

module.exports.getModelConfig = (req, res) => {
  const currentModel = global._amConfig.models.find(m => m.collection.name === req.params.model);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const keys = fnHelper.getModelProperties(currentModel);

  res.json({
    keys,
    name: currentModel.collection.name
  });
};

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
      const label = fieldsToDisplay.replace(/[a-z._]+/gi, word => global._.get(d, word));
      return { label, value: d._id };
    });
  }

  res.json({ data: formattedData });
};

module.exports.postOne = async (req, res) => {
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
    res.json({ data: { id: newSavedItem._id } }); // id and not _id to be generic
  }
};

module.exports.get = async (req, res) => {
  const modelName = req.params.model;
  const segment = req.body.segment;
  const search = (req.body.search || '').trim();
  const filters = req.body.filters;
  const refFields = req.body.refFields;
  const page = parseInt(req.body.page || 1);
  const nbItemPerPage = 10;

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const keys = fnHelper.getModelProperties(currentModel);
  const defaultFieldsToFetch = keys.filter(key => !key.path.includes('.')).map(key => key.path);
  const fieldsToFetch = req.body.fields || defaultFieldsToFetch;

  const defaultFieldsToSearchIn = keys.filter(key => ['String'].includes(key.type)).map(key => key.path);
  const fieldsToSearchIn = /*['email', 'firstname', 'lastname'] ||*/ defaultFieldsToSearchIn;
  const sortingFields = { _id: 'desc' };

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

  // Segment
  if (segment && segment.type === 'simple') {
    const segmentQuery = fnHelper.constructQuery(segment.data.list, segment.data.operator);
    if (segmentQuery) {
      params = { $and: [params, segmentQuery] };
    }
  }
  else if (segment && segment.type === 'query') {
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
    .sort(sortingFields)
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

module.exports.getOne = async (req, res) => {
  const modelName = req.params.model;
  const modelItemId = req.params.id;
  const refFields = req.body.refFields || {};

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const keys = fnHelper.getModelProperties(currentModel);
  const defaultFieldsToFetch = keys.map(key => key.path);
  const fieldsToFetch = req.body.fields ? req.body.fields : defaultFieldsToFetch;

  // Build ref fields for the model (for mongoose population purpose)
  const fieldsToPopulate = fnHelper.getFieldsToPopulate(keys, fieldsToFetch, refFields);

  let data = await currentModel
    .findById(modelItemId)
    .select(fieldsToFetch)
    .populate(fieldsToPopulate)
    .lean()
    .catch(e => {
      res.status(403).json({ message: e.message });
    });

  if (!data) {
    return res.status(403).json();
  }

  data = fnHelper.refFields(data, fieldsToPopulate);

  res.json({
    data
  });
};

module.exports.putOne = async (req, res) => {
  const modelName = req.params.model;
  const modelItemId = req.params.id;
  const data = req.body.data;

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  // const { model, itemEditableKeys } = models[modelName];

  // Only keep authorized keys
  // const cleanData = {};
  // updatableFields.forEach(updatableField => {
  //   const fieldValue = global._.get(data, updatableField);
  //   if (fieldValue) {
  //     global._.set(cleanData, updatableField, fieldValue)
  //   }
  // });

  const cleanData = data;

  if (Object.keys(cleanData).length) {
    try {
      await currentModel.findByIdAndUpdate(modelItemId, cleanData, { runValidators: true });
      res.json({ data: cleanData });
    }
    catch(e) {
      const errorObject = fnHelper.buildError(e, 'Unable to update the model');
      res.status(403).json(errorObject);
    }
  }
  else {
    res.json({});
  }
};

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

module.exports.customQuery = async (req, res) => {
  const data = req.body.data;
  const modelName = data.model;

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  if (data.type === 'pie') {
    let sum = 1;
    if (data.field && data.operation === 'sum') {
      sum = `$${data.field}`;
    }

    const repartitionData = await currentModel
      .aggregate([
        {
          $group: {
            _id: `$${data.group_by}`,
            count: { $sum: sum },
          }
        },
        {
          $project: {
            key: '$_id',
            value: '$count',
            _id: false
          }
        }
      ])
      .sort({ key: 1 });

    res.json({ data: repartitionData });
  }
  else if (data.type === 'single_value') {
    if (data.operation === 'sum') {
      const sumData = await currentModel
        .aggregate([{
          $group: {
            _id: `$${data.group_by}`,
            count: { $sum: `$${data.field}` },
          }
        }]);

      if (!sumData || !sumData[0] || typeof sumData[0].count !== 'number') {
        return res.status(403).json();
      }

      res.json({ data: sumData[0].count });
    }
    else {
      const dataCount = await currentModel.countDocuments({});
      res.json({ data: dataCount });
    }
  }
  else {
    res.json({ data: null });
  }
};