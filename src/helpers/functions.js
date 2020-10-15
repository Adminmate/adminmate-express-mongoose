const mongoose = require('mongoose');
const mongooseLegacyPluralize = require('mongoose-legacy-pluralize');

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

    if (modelProps[key].enumValues && modelProps[key].enumValues.length) {
      property.enum = modelProps[key].enumValues;
    }
    if (modelProps[key].options.default) {
      property.default = modelProps[key].options.default;
    }
    if (modelProps[key].options.ref) {
      property.ref = modelProps[key].options.ref;
    }
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

module.exports.constructQuery = criterias => {
  const query = [];
  criterias.forEach(criteria => {
    let q = {};
    if (criteria.operator === 'is') {
      q[criteria.field] = { $eq: criteria.value };
    }
    else if (criteria.operator === 'is_not') {
      q[criteria.field] = { $neq: criteria.value };
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
  return query.length ? { $and: query } : {};
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

module.exports.constructSearch = (search, fieldsToSearchIn) => {
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

module.exports.getModelObject = (modelCode) => {
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