const { init, isAuthorized } = require(global.AM_DEV_MODE ? '../adminmate-express-core' : 'adminmate-express-core');

// Controllers
const modelsCtrl = require('./src/controllers/models');
const customActionsCtrl = require('./src/controllers/customactions');
const segmentsCtrl = require('./src/controllers/segments');

// CRUD
const { getAll } = require('./src/controllers/model-getall');
const { getOne } = require('./src/controllers/model-getone');
const { postOne } = require('./src/controllers/model-postone');
const { putOne } = require('./src/controllers/model-putone');
const { deleteSome } = require('./src/controllers/model-deletesome');
const { getAutocomplete } = require('./src/controllers/model-autocomplete');
const { customQuery } = require('./src/controllers/model-query');

const Adminmate = ({ projectId, secretKey, authKey, masterPassword, models, authorizedIps }) => {
  const api = {
    // General
    getModels: modelsCtrl.getModels,
    getModelsProperties: modelsCtrl.getModelsProperties,

    // Custom actions
    getCustomActions: customActionsCtrl.getAll,
    getCustomAction: customActionsCtrl.get,

    // Segments
    getSegments: segmentsCtrl.getAll,

    // CRUD
    modelGetAll: getAll,
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
    authorizedIps,
    api
  });
};

module.exports = {
  init: Adminmate,
  isAuthorized,
};