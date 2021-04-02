const { init, isAuthorized } = require(global.AM_DEV_MODE ? '../adminmate-express-core' : 'adminmate-express-core');

// Controllers
const modelCtrl = require('./src/controllers/model');
const customActionsCtrl = require('./src/controllers/customactions');
const segmentsCtrl = require('./src/controllers/segments');

const Adminmate = ({ projectId, secretKey, authKey, masterPassword, models, authorizedIps }) => {
  const api = {
    getModels: modelCtrl.getModels,
    getModelsProperties: modelCtrl.getModelsProperties,

    getCustomActions: customActionsCtrl.getAll,
    getCustomAction: customActionsCtrl.get,

    getSegments: segmentsCtrl.getAll,

    modelGetAll: modelCtrl.get,
    modelGetOne: modelCtrl.getOne,
    modelPostOne: modelCtrl.postOne,
    modelPutOne: modelCtrl.putOne,
    modelDeleteSome: modelCtrl.deleteSome,
    modelGetAutocomplete: modelCtrl.getAutocomplete,
    modelCustomQuery: modelCtrl.customQuery
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