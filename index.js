const { init, isAuthorized } = require(global.AM_DEV_MODE ? '../adminmate-express-core' : 'adminmate-express-core');

// Helpers
const fnHelper = require('./src/helpers/functions');

// CRUD
const { getAll } = require('./src/controllers/model-getall');
const { getIn } = require('./src/controllers/model-getin');
const { getOne } = require('./src/controllers/model-getone');
const { getRefs } = require('./src/controllers/model-getrefs');
const { postOne } = require('./src/controllers/model-postone');
const { putOne } = require('./src/controllers/model-putone');
const { deleteSome } = require('./src/controllers/model-deletesome');
const { getAutocomplete } = require('./src/controllers/model-autocomplete');
const { customQuery } = require('./src/controllers/model-query');

const Adminmate = ({ projectId, secretKey, authKey, masterPassword, models, charts, authorizedIps }) => {
  const api = {
    // App config
    getAppConfig: fnHelper.getAppConfig,

    // General
    getModelProperties: fnHelper.getModelProperties,
    getModelRealname: fnHelper.getModelRealname,
    getModelRelationships: fnHelper.getModelAssociations,
    getModelPrimaryKeys: fnHelper.getModelPrimaryKeys,
    getModelWhereClause: fnHelper.getModelWhereClause,

    // CRUD
    modelGetAll: getAll,
    modelGetIn: getIn,
    modelGetOne: getOne,
    modelGetRefs: getRefs,
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