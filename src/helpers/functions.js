const mongoose = require('mongoose');
const mongooseLegacyPluralize = require('mongoose-legacy-pluralize');
const { serializeError } = require('serialize-error');

module.exports.getModelProperties = model => {
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
      property.enum = modelProps[key].options.enum.values;
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
    } else {
      modelFields.push(property);
    }
  });

  return modelFields;
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
      let label = '';
      if (matchingField.select === '_id') {
        label = global._.get(item, `${attr}._id`);
      }
      else {
        label = matchingField.select.replace(/[a-z._]+/gi, word => {
          return global._.get(item, `${attr}.${word}`);
        });
      }

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
  // Build ref fields for the model (for mongoose population purpose)
  const refFieldsForModel = {};
  keys.forEach(prop => {
    if (prop.type === 'ObjectID' && (prop.ref || prop.refPath)) {
      if (prop.ref) {
        const currentRefModelName = prop.ref.toLowerCase();
        const currentRefModelNamePlural = mongooseLegacyPluralize(currentRefModelName);
        if (refFields[currentRefModelName] || refFields[currentRefModelNamePlural]) {
          refFieldsForModel[prop.path] = refFields[currentRefModelName] || refFields[currentRefModelNamePlural];
        }
      }
      else if (prop.refPath) {
        const refPathField = keys.find(k => k.path === prop.refPath);
        if (refPathField && refPathField.enum) {
          const currentRefModelName = refPathField.enum[0].toLowerCase();
          const currentRefModelNamePlural = mongooseLegacyPluralize(currentRefModelName);
          if (refFields[currentRefModelName] || refFields[currentRefModelNamePlural]) {
            refFieldsForModel[prop.path] = refFields[currentRefModelName] || refFields[currentRefModelNamePlural];
          }
        }
      }
    }
  });

  // Create query populate config
  let fieldsToPopulate = [];
  fieldsToFetch.forEach(field => {
    const matchingField = keys.find(k => k.path === field);
    if (matchingField && matchingField.type === 'ObjectID' && (matchingField.ref || matchingField.refPath)) {
      fieldsToPopulate.push({
        path: field,
        select: refFieldsForModel[field] ? refFieldsForModel[field] : '_id'
      });
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

module.exports.getModelObject = modelCode => {
  if (!modelCode) {
    return null;
  }

  const currentRefModelName = modelCode.toLowerCase();
  const currentRefModelNamePlural = mongooseLegacyPluralize(currentRefModelName);

  const currentModel = global._amConfig.models
    .find(m => {
      const collectionName = typeof m === 'function' ? m.collection.name : m.model.collection.name;
      return collectionName === currentRefModelName || collectionName === currentRefModelNamePlural;
    });

  if (!currentModel) {
    return null;
  }

  const currentModelObject = typeof currentModel === 'function' ? currentModel : currentModel.model;

  return currentModelObject;
};

module.exports.getModelSmartActions = modelCode => {
  if (!modelCode) {
    return null;
  }

  const currentRefModelName = modelCode.toLowerCase();
  const currentRefModelNamePlural = mongooseLegacyPluralize(currentRefModelName);

  const currentModel = global._amConfig.models
    .find(m => {
      const collectionName = typeof m === 'function' ? m.collection.name : m.model.collection.name;
      return collectionName === currentRefModelName || collectionName === currentRefModelNamePlural;
    });

  if (!currentModel) {
    return null;
  }

  const currentModelSmartActions = typeof currentModel === 'function' ? null : currentModel.smartActions;

  return currentModelSmartActions;
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