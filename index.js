const Adminmate = ({ projectId, secretKey, authKey, masterPassword, models, charts, authorizedIps, devMode = false, testMode = false, agentKeyVerification = true, agentKeyVerifyUrl = null }) => {
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
  // AI agents (MCP): revocation check of agent keys against the Adminmate API
  _conf.agentKeyVerification = agentKeyVerification !== false;
  if (agentKeyVerifyUrl) {
    _conf.agentKeyVerifyUrl = agentKeyVerifyUrl;
  }

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

  // AI agents: approval requests & logs storage (dedicated collections)
  let agentStore = null;
  try {
    agentStore = require('./src/agent-store')(_conf);
  }
  catch(e) {
    console.warn('[adminmate] Unable to initialize the agent store:', e && e.message);
    agentStore = null;
  }

  const api = {
    // App config
    getAppConfig: fnHelper.getAppConfig,
    getAvailableFeatures: () => {
      return {
        charts: ['single_value', 'pie', 'bar', 'line', 'objective', 'ranking']
      };
    },

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
    modelCustomQuery: customQuery,

    // AI agents (optional)
    agentStore
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
