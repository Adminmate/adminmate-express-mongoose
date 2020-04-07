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