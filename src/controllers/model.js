const mongoose = require('mongoose');
const fnHelper = require('../helpers/functions');

module.exports.getModels = (req, res) => {
  let models = [];
  global._config.models.forEach(model => {
    models.push(model.collection.name);
  });
  res.json({ models });
};

module.exports.getModelConfig = (req, res) => {
  const currentModel = global._config.models.find(m => m.collection.name === req.params.model);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }
  const keys = fnHelper.getModelProperties(currentModel);
  res.json({ keys });
};

module.exports.get = async (req, res) => {
  const modelName = req.params.model;
  // const submodelName = req.params.submodel;
  const search = (req.body.search || '').trim();
  const filters = req.body.filters;
  const page = parseInt(req.body.page || 1);
  // const subSection = req.query.subsection;
  const nbItemPerPage = 10;

  const currentModel = global._config.models.find(m => m.collection.name === modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const keys = fnHelper.getModelProperties(currentModel);
  console.log('==model keys properties', keys);
  const defaultFieldsToFetch = keys.map(key => key.path);
  const fieldsToFetch = ['_id', 'email', 'firstname', 'lastname', 'client_id'] || defaultFieldsToFetch;
  const fieldsToSeachIn = ['email', 'firstname', 'lastname'] || defaultFieldsToFetch;
  const sortingFields = {}; // { _id: 'asc' };

  const fieldPopulateConfig = {
    client_id: 'firstname lastname'
  };

  // Create query populate config
  let fieldsToPopulate = [];
  fieldsToFetch.forEach(field => {
    const matchingField = keys.find(k => k.path === field);
    if (matchingField && matchingField.type === 'ObjectID' && matchingField.ref) {
      fieldsToPopulate.push({
        path: field,
        select: fieldPopulateConfig[field] ? fieldPopulateConfig[field] : '_id'
      });
    }
  });

  let params = {};

  // If there is a text search query
  if (search) {
    params = { $or: [] };

    fieldsToSeachIn.map(field => {
      params.$or.push({ [field]: { '$regex': `${search}`, '$options': 'i' } });
    });

    // If the search is a valid mongodb _id
    // An object id's only defining feature is that its 12 bytes long
    if (mongoose.Types.ObjectId.isValid(search)) {
      params.$or.push({ _id: search });
      fieldsToPopulate.map(field => {
        params.$or.push({ [field.path]: search });
      });
    }

    // If the search terms contains multiple words and there is multiple fields to search in
    if (/\s/.test(search) && fieldsToSeachIn.length > 1) {
      // Create all search combinaisons for $regexMatch
      const searchPieces = search.split(' ');
      const searchCombinaisons = fnHelper
        .permutations(searchPieces)
        .map(comb => fnHelper.cleanString(comb.join('')))
        .join('|');
      const concatFields = fieldsToSeachIn.map(field => `$${field}`);

      params.$or.push({
        $expr: {
          $regexMatch: {
            input: {
              $concat: concatFields
            },
            regex: new RegExp(searchCombinaisons),
            options: 'i'
          }
        }
      });
    }
  }
  if (filters && filters.length) {
    const filter = filters[0];
    params[filter.attr] = filter.value;
  }

  // if (submodelName && subSections) {
  //   const fetchSubSection = subSections.find(s => s.code === submodelName);
  //   if (fetchSubSection && fetchSubSection.query) {
  //     params = {$and: [params, fetchSubSection.query] };
  //   }
  // }

  let data = await currentModel
    .find(params)
    .select(fieldsToFetch)
    .populate(fieldsToPopulate)
    .sort(sortingFields)
    .skip(nbItemPerPage * (page - 1))
    .limit(nbItemPerPage)
    .lean();

  // console.log('===data', data);

  const dataCount = await currentModel.countDocuments(params);
  const nbPage = Math.ceil(dataCount / nbItemPerPage);

  // Make ref fields appeared as link in the dashboard
  data = data.map(item => {
    const attributes = Object.keys(item);
    attributes.forEach(attr => {
      const matchingField = fieldsToPopulate.find(field => field.path === attr);
      if (matchingField) {
        const label = matchingField.select === '_id' ? item[attr]._id : matchingField.select.replace(/[a-z]+/gi, word => {
          return item[attr][word];
        });
        item[attr] = {
          type: 'ref',
          id: item[attr]._id,
          label
        };
      }
    });
    return item;
  });

  // Properties cleaning
  const finalData = [];
  data.forEach(d => {
    const item = {};
    const listKeys = Object.keys(d);
    listKeys.forEach(k => {
      item[k] = typeof d[k] === 'undefined' ? '' : d[k];
    });
    finalData.push(item);
  });

  res.json({
    data: finalData,
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

  const currentModel = global._config.models.find(m => m.collection.name === modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const keys = fnHelper.getModelProperties(currentModel);
  console.log('==model keys properties', keys);
  const defaultFieldsToFetch = keys.map(key => key.path);
  const fieldsToFetch = ['_id', 'email', 'firstname', 'lastname', 'client_id'] || defaultFieldsToFetch;

  let data = await currentModel
    .findById(modelItemId)
    .select(fieldsToFetch)
    .lean();

  res.json({
    data,
    modelFields: keys,
    itemListKeys: fieldsToFetch,
    itemEditableKeys: fieldsToFetch
  });
};