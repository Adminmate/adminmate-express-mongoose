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

    modelFields.push(property);
  });

  return modelFields;
};

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

module.exports.cleanString = string => {
  return string.toLowerCase().replace(/\W/g, '');
};