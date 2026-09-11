// Storage for AI agent action requests (human approval workflow) and agent call logs.
// Uses the connection of the first configured mongoose model, in dedicated collections.
const mongoose = require('mongoose');

const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'executed', 'failed'];

module.exports = _conf => {
  const firstModelConfig = (_conf.models || []).find(m => m && m.model && m.model.db);
  if (!firstModelConfig) {
    return null;
  }

  const connection = firstModelConfig.model.db;
  const Schema = mongoose.Schema;

  const RequestSchema = new Schema({
    model: { type: String, required: true },
    action_code: { type: String, required: true },
    action_label: { type: String, default: '' },
    item_ids: { type: [String], default: [] },
    data: { type: Schema.Types.Mixed, default: {} },
    agent: {
      key_id: { type: String, required: true },
      name: { type: String, default: 'Agent' }
    },
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending' },
    decided_by: {
      user_id: { type: String, default: null },
      name: { type: String, default: null }
    },
    decided_at: { type: Date, default: null },
    reason: { type: String, default: null },
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    created_at: { type: Date, default: Date.now }
  }, { minimize: false, versionKey: false });

  RequestSchema.index({ status: 1, created_at: -1 });
  RequestSchema.index({ 'agent.key_id': 1, created_at: -1 });

  const LogSchema = new Schema({
    agent: {
      key_id: { type: String, required: true },
      name: { type: String, default: 'Agent' }
    },
    tool: { type: String, required: true },
    model: { type: String, default: null },
    params: { type: String, default: null },
    success: { type: Boolean, default: true },
    error: { type: String, default: null },
    duration_ms: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
  }, { versionKey: false });

  LogSchema.index({ created_at: -1 });
  LogSchema.index({ 'agent.key_id': 1, created_at: -1 });

  const getModel = (name, schema, collection) => {
    if (connection.models && connection.models[name]) {
      return connection.models[name];
    }
    return connection.model(name, schema, collection);
  };

  const AgentRequest = getModel('AdminmateAgentRequest', RequestSchema, 'adminmate_agent_requests');
  const AgentLog = getModel('AdminmateAgentLog', LogSchema, 'adminmate_agent_logs');

  const isValidId = id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

  const clampLimit = (limit, fallback, max) => {
    const parsed = parseInt(limit, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.min(parsed, max);
  };

  const createRequest = async ({ model, action_code, action_label, item_ids, data, agent }) => {
    const request = new AgentRequest({
      model,
      action_code,
      action_label: action_label || '',
      item_ids: Array.isArray(item_ids) ? item_ids.map(String) : [],
      data: data && typeof data === 'object' ? data : {},
      agent: {
        key_id: agent && agent.key_id ? String(agent.key_id) : 'unknown',
        name: agent && agent.name ? String(agent.name) : 'Agent'
      },
      status: 'pending'
    });
    const saved = await request.save();
    return saved.toObject();
  };

  const getRequest = async id => {
    if (!isValidId(String(id))) {
      return null;
    }
    return AgentRequest.findById(id).lean();
  };

  const listRequests = async ({ status = null, models = null, model = null, limit = 50 } = {}) => {
    const query = {};
    if (status && REQUEST_STATUSES.includes(status)) {
      query.status = status;
    }
    if (Array.isArray(models)) {
      query.model = { $in: models };
    }
    else if (model) {
      query.model = model;
    }
    return AgentRequest
      .find(query)
      .sort({ created_at: -1 })
      .limit(clampLimit(limit, 50, 200))
      .lean();
  };

  const updateRequest = async (id, patch) => {
    if (!isValidId(String(id))) {
      return null;
    }
    const allowed = ['status', 'decided_by', 'decided_at', 'reason', 'result', 'error'];
    const safePatch = {};
    Object.keys(patch || {}).forEach(key => {
      if (allowed.includes(key)) {
        safePatch[key] = patch[key];
      }
    });
    return AgentRequest.findByIdAndUpdate(id, { $set: safePatch }, { new: true, runValidators: true }).lean();
  };

  const log = async ({ agent, tool, model, params, success, error, duration_ms }) => {
    const entry = new AgentLog({
      agent: {
        key_id: agent && agent.key_id ? String(agent.key_id) : 'unknown',
        name: agent && agent.name ? String(agent.name) : 'Agent'
      },
      tool: String(tool || 'unknown'),
      model: model ? String(model) : null,
      params: typeof params === 'string' ? params.slice(0, 2048) : null,
      success: success !== false,
      error: error ? String(error).slice(0, 1000) : null,
      duration_ms: Number.isFinite(duration_ms) ? duration_ms : 0
    });
    await entry.save();
  };

  const listLogs = async ({ limit = 100, key_id = null, model = null } = {}) => {
    const query = {};
    if (key_id) {
      query['agent.key_id'] = String(key_id);
    }
    if (model) {
      query.model = String(model);
    }
    return AgentLog
      .find(query)
      .sort({ created_at: -1 })
      .limit(clampLimit(limit, 100, 500))
      .lean();
  };

  return {
    createRequest,
    getRequest,
    listRequests,
    updateRequest,
    log,
    listLogs,
    models: { AgentRequest, AgentLog }
  };
};
