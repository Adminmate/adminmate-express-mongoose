const Adminmate = ({ projectId, secretKey, authKey, masterPassword, models, charts, authorizedIps, devMode = false, testMode = false }) => {
  const _conf = {};
  _conf.projectId = projectId;
  _conf.secretKey = secretKey;
  _conf.authKey = authKey;
  _conf.masterPassword = masterPassword;
  _conf.models = models || [];
  _conf.charts = charts || [];
  _conf.authorizedIps = authorizedIps || null;
  _conf.devMode = devMode;
  _conf.testMode = testMode;

  const amCore = require(_conf.devMode ? '../adminmate-express-core' : 'adminmate-express-core');

  // Helpers
  const fnHelper = require('./src/helpers/functions')(_conf);

  // CRUD
  const getAll = require('./src/controllers/model-getall')(_conf);
  const getIn = require('./src/controllers/model-getin')(_conf);
  const getOne = require('./src/controllers/model-getone')(_conf);
  const getRefs = require('./src/controllers/model-getrefs')(_conf);
  const postOne = require('./src/controllers/model-postone')(_conf);
  const putOne = require('./src/controllers/model-putone')(_conf);
  const deleteSome = require('./src/controllers/model-deletesome')(_conf);
  const getAutocomplete = require('./src/controllers/model-autocomplete')(_conf);
  const customQuery = require('./src/controllers/model-query')(_conf);

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

  if (testMode === true) {
    return api;
  }

  return amCore.init({
    config: _conf,
    api
  });
};

module.exports = {
  init: Adminmate
};
