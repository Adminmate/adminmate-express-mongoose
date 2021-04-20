const { init, isAuthorized } = require(global.AM_DEV_MODE ? '../adminmate-express-core' : 'adminmate-express-core');

// Helpers
const fnHelper = require('./src/helpers/functions');

// CRUD
const { getAll } = require('./src/controllers/model-getall');
const { getIn } = require('./src/controllers/model-getin');
const { getOne } = require('./src/controllers/model-getone');
const { postOne } = require('./src/controllers/model-postone');
const { putOne } = require('./src/controllers/model-putone');
const { deleteSome } = require('./src/controllers/model-deletesome');
const { getAutocomplete } = require('./src/controllers/model-autocomplete');
const { customQuery } = require('./src/controllers/model-query');

const Adminmate = ({ projectId, secretKey, authKey, masterPassword, models, charts, authorizedIps }) => {
  const api = {
    // General
    getModelProperties: fnHelper.getModelProperties,
    getModelRealname: fnHelper.getModelRealname,

    // CRUD
    modelGetAll: getAll,
    modelGetIn: getIn,
    modelGetOne: getOne,
    modelPostOne: postOne,
    modelPutOne: putOne,
    modelDeleteSome: deleteSome,
    modelGetAutocomplete: getAutocomplete,
    modelCustomQuery: customQuery
  };

  return init({
    projectId,
    secretKey,
    authKey,
    masterPassword,
    models,
    charts,
    authorizedIps,
    api
  });
};

module.exports = {
  init: Adminmate,
  isAuthorized,
};