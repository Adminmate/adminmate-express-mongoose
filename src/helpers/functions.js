const mongoose = require('mongoose');
const mongooseLegacyPluralize = require('mongoose-legacy-pluralize');
const { serializeError } = require('serialize-error');
const _ = require('lodash');

const getModelProperties = model => {
  let modelFields = [];
  const modelProps = model.schema.paths;

  Object.keys(modelProps).forEach(key => {
    if (key === '__v') {
      return;
    }
    let property = {
      path: key,
      type: modelProps[key].instance
    };

    if (property.type === 'Array') {
      const optionsTypes = modelProps[key].options.type;
      if (optionsTypes && optionsTypes[0] && typeof optionsTypes[0] === 'function') {
        property.type = `ArrayOf${optionsTypes[0].name}`;
      }
      else {
        property.type = 'ArrayOfObject';
      }
    }

    // Required option
    if (modelProps[key].options.required) {
      property.required = true;
    }

    // Default value option
    if (typeof modelProps[key].options.default !== 'undefined') {
      if (typeof modelProps[key].options.default === 'function') {
        property.default = modelProps[key].options.default();
      }
      else {
        property.default = modelProps[key].options.default;
      }
    }
    // Enum option
    if (modelProps[key].options.enum) {
      property.enum = modelProps[key].enumValues;
    }
    // Ref option
    if (modelProps[key].options.ref) {
      property.ref = modelProps[key].options.ref;
    }
    // RefPath option
    if (modelProps[key].options.refPath) {
      property.refPath = modelProps[key].options.refPath;
    }

    if (key === '_id') {
      modelFields.unshift(property);
    }
    else {
      modelFields.push(property);
    }
  });

  return modelFields;
};

module.exports.getModelProperties = getModelProperties;

// Return real mongoose model name
module.exports.getModelRealname = model => {
  return model.modelName;
};

// To be used in this file
const permutations = list => {
  if (list.length <= 1) {
    return list.slice();
  }

  let result = [],
    i = 0,
    j,
    current,
    rest;

  for(; i < list.length; i++) {
    rest = list.slice(); // make a copy of list
    current = rest.splice(i, 1);
    permutationsRest = permutations(rest);
    for(j = 0; j < permutationsRest.length; j++) {
      result.push(current.concat(permutationsRest[j]));
    }
  }
  return result;
};

module.exports.permutations = permutations;

// To be used in this file
const cleanString = string => {
  return string.toLowerCase().replace(/\W/g, '');
};

module.exports.cleanString = cleanString;

module.exports.constructQuery = (criterias, operator = 'and') => {
  if (!['and', 'or'].includes(operator)) {
    return {};
  }

  const query = [];
  criterias.forEach(criteria => {
    let q = {};
    if (criteria.operator === 'is') {
      q[criteria.field] = { $eq: criteria.value };
    }
    else if (criteria.operator === 'is_not') {
      q[criteria.field] = { $neq: criteria.value };
    }
    else if (criteria.operator === 'is_true') {
      q[criteria.field] = { $eq: true };
    }
    else if (criteria.operator === 'is_false') {
      q[criteria.field] = { $eq: false };
    }
    else if (criteria.operator === 'is_present') {
      q[criteria.field] = { $exists: true };
    }
    else if (criteria.operator === 'is_blank') {
      q[criteria.field] = { $exists: false };
    }
    else if (criteria.operator === 'start_with') {
      const regexp = new RegExp(`^${criteria.value}`);
      q[criteria.field] = { $regex: regexp, $options: 'i' };
    }
    else if (criteria.operator === 'end_with') {
      const regexp = new RegExp(`${criteria.value}$`);
      q[criteria.field] = { $regex: regexp, $options: 'i' };
    }
    else if (criteria.operator === 'contains') {
      const regexp = new RegExp(`${criteria.value}`);
      q[criteria.field] = { $regex: regexp, $options: 'i' };
    }
    else if (criteria.operator === 'not_contains') {
      const regexp = new RegExp(`^((?!${criteria.value}).)*$`);
      q[criteria.field] = { $regex: regexp, $options: 'i' };
    }
    query.push(q);
  });
  return query.length ? { [`$${operator}`]: query } : {};
};

module.exports.refFields = (item, fieldsToPopulate) => {
  const attributes = Object.keys(item);
  attributes.forEach(attr => {

    // Set to empty instead of undefined
    item[attr] = typeof item[attr] === 'undefined' ? '' : item[attr];

    // Manage populate fields
    const matchingField = fieldsToPopulate.find(field => field.path === attr);

    if (matchingField) {
      let fieldsList = '';
      if (matchingField.multipleRefField && matchingField.multipleValues) {
        const modelToCheck = item[matchingField.multipleRefField];
        if (modelToCheck && matchingField.multipleValues[modelToCheck]) {
          fieldsList = matchingField.multipleValues[modelToCheck];
        }
        else {
          fieldsList = '_id';
        }
      }
      else {
        fieldsList = matchingField.select;
      }

      const label = fieldsList.replace(/[a-z._]+/gi, word => {
        return _.get(item, `${attr}.${word}`);
      });

      if (item[attr]) {
        item[attr] = {
          type: 'ref',
          id: item[attr]._id,
          label
        };
      }
      else {
        item[attr] = '(deleted)';
      }
    }
  });
  return item;
};

module.exports.getFieldsToPopulate = (keys, fieldsToFetch, refFields = {}) => {
  // Create query populate config
  let fieldsToPopulate = [];
  fieldsToFetch.forEach(field => {
    const matchingField = keys.find(k => k.path === field);
    if (matchingField && matchingField.type === 'ObjectID' && (matchingField.ref || matchingField.refPath)) {

      let fieldToSelect = '_id';
      let toPush = {
        path: field,
        select: '_id'
      };

      // For ref attributes
      if (matchingField.ref) {
        const matchingModel = global._amConfig.models.find(m => m.model.modelName === matchingField.ref);
        if (matchingModel && matchingModel.slug && refFields[matchingModel.slug]) {
          toPush.select = refFields[matchingModel.slug];
        }
      }
      // For refPath attributes
      else if (matchingField.refPath) {
        const multipleValues = {};
        const refPathField = keys.find(k => k.path === matchingField.refPath);
        if (refPathField && refPathField.enum) {
          refPathField.enum.forEach(modelName => {
            multipleValues[modelName] = '_id';
            const matchingModel = global._amConfig.models.find(m => m.model.modelName === modelName);
            if (matchingModel && matchingModel.slug && refFields[matchingModel.slug]) {
              // Merge all ref models fields
              fieldToSelect += ` ${refFields[matchingModel.slug]}`;
              multipleValues[modelName] = refFields[matchingModel.slug];
            }
          });
          toPush.select = fieldToSelect || '_id';
          toPush.multipleRefField = matchingField.refPath;
          toPush.multipleValues = multipleValues;
        }
      }

      fieldsToPopulate.push(toPush);
    }
  });

  return fieldsToPopulate;
};

module.exports.constructSearch = (search, fieldsToSearchIn, fieldsToPopulate = []) => {
  params = { $or: [] };

  fieldsToSearchIn.map(field => {
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
  if (/\s/.test(search) && fieldsToSearchIn.length > 1) {
    // Create all search combinaisons for $regexMatch
    const searchPieces = search.split(' ');
    const searchCombinaisons = permutations(searchPieces)
      .map(comb => cleanString(comb.join('')))
      .join('|');
    const concatFields = fieldsToSearchIn.map(field => `$${field}`);

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

  return params;
};

module.exports.getModelAssociations = modelCode => {
  if (!modelCode) {
    return null;
  }

  // Get current model mongoose realname
  const currentModel = global._amConfig.models.find(m => m.slug === modelCode);
  const currentModelRealName = currentModel.model.modelName;

  // List all the models that reference the current model
  const associationsList = [];
  global._amConfig.models
    .filter(mc => mc.slug !== modelCode)
    .forEach(mc => {
      const modelProperties = getModelProperties(mc.model);
      if (modelProperties && modelProperties.length) {
        modelProperties.forEach(mp => {
          if (mp.ref === currentModelRealName) {
            associationsList.push({
              model: mc.model,
              slug: mc.slug,
              ref_field: mp.path
            });
          }
        })
      }
    });

  return associationsList;
};

const getModel = modelCode => {
  if (!modelCode) {
    return null;
  }

  const currentModel = global._amConfig.models.find(m => m.slug === modelCode);

  return currentModel;
};

module.exports.getModelObject = modelCode => {
  const currentModel = getModel(modelCode);
  if (!currentModel) {
    return null;
  }

  return currentModel.model;
};

module.exports.getModelSegments = modelCode => {
  const currentModel = getModel(modelCode);
  if (!currentModel) {
    return null;
  }

  return currentModel.segments;
};

module.exports.buildError = (e, defaultMessage) => {
  if (e && e.errors) {
    let arr = [];
    Object.entries(e.errors).forEach(value => {
      arr.push({ field: value[0], message: value[1].message });
    });
    return { message: defaultMessage, error_details: arr };
  }
  else if (e && e.message) {
    const errorObject = serializeError(e);
    const arr = [{
      message: errorObject.stack
    }];
    return { message: defaultMessage, error_details: arr };
  }
  return { message: defaultMessage };
};

module.exports.validateOrderStructure = orderConfig => {
  let bool = true;
  if (orderConfig && Array.isArray(orderConfig)) {
    orderConfig.forEach(oc => {
      if (!Array.isArray(oc) || oc.length !== 2 && !['ASC', 'DESC'].includes(oc[1])) {
        bool = false;
      }
    });
  }
  else {
    bool = false;
  }
  return bool;
};

module.exports.getCleanOrderStructure = orderConfig => {
  const order = {};
  orderConfig.forEach(oc => {
    order[oc[0]] = oc[1];
  });
  return order;
};