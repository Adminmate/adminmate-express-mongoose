const { init, isAuthorized } = require(global.AM_DEV_MODE ? '../adminmate-express-core' : 'adminmate-express-core');

// Controllers
const modelController = require('./src/controllers/model');
const smartActionsController = require('./src/controllers/smartactions');
const segmentsController = require('./src/controllers/segments');

const Adminmate = ({ projectId, secretKey, authKey, masterPassword, models, authorizedIps }) => {
  const api = {
    getModels: modelController.getModels,
    getModelsProperties: modelController.getModelsProperties,
    getSmartActions: smartActionsController.getAll,
    getSmartAction: smartActionsController.get,
    getSegments: segmentsController.getAll,
    modelGet: modelController.get,
    modelGetAutocomplete: modelController.getAutocomplete,
    modelGetOne: modelController.getOne,
    modelPostOne: modelController.postOne,
    modelPutOne: modelController.putOne,
    modelDeleteSome: modelController.deleteSome,
    modelCustomQuery: modelController.customQuery
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