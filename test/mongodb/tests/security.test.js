const httpMocks = require('node-mocks-http');

const makeReq = (model, data, headers = {}) => {
  return httpMocks.createRequest({
    method: 'GET',
    params: { model },
    headers,
    query: data,
    body: data
  });
};

const makeChartReq = data => {
  return httpMocks.createRequest({ method: 'POST', body: { data } });
};

module.exports = api => {
  describe('Security hardening', () => {
    it('- rows per page is capped to 500', async () => {
      const request = makeReq('cars', { rows: 100000 });
      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response);
      const json = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(json.pagination.rows_per_page).toBe(500);
    });

    it('- ordering on an unknown field falls back to the default ordering', async () => {
      const request = makeReq('cars', { order: [['$where', 'ASC']] }, { 'am-model-fields': ['name'] });
      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response);
      expect(response.statusCode).toBe(200);
      expect(response._getJSONData().data.length).toBeGreaterThan(0);
    });

    it('- regex special characters in filters are escaped (no ReDoS, no injection)', async () => {
      const request = makeReq('cars', {
        filters: {
          operator: 'and',
          list: [{ field: 'name', operator: 'contains', value: '(a+)+$' }]
        }
      }, { 'am-model-fields': ['name'] });
      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response);
      expect(response.statusCode).toBe(200);
      expect(response._getJSONData().count).toBe(0);
    });

    it('- not_contains with a regex payload is escaped', async () => {
      const request = makeReq('cars', {
        filters: {
          operator: 'and',
          list: [{ field: 'name', operator: 'not_contains', value: '.*' }]
        }
      }, { 'am-model-fields': ['name'] });
      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response);
      expect(response.statusCode).toBe(200);
      // No car contains the literal ".*" so all of them match
      expect(response._getJSONData().count).toBeGreaterThan(0);
    });

    it('- multi-word search with more than 4 words does not explode', async () => {
      const request = makeReq('cars', { search: 'a b c d e f g h i j' }, { 'am-model-fields': ['name'] });
      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response);
      expect(response.statusCode).toBe(200);
    });

    it('- chart with an unknown group_by field is rejected', async () => {
      const request = makeChartReq({ type: 'pie', model: 'users', group_by: 'password', operation: 'count' });
      const response = httpMocks.createResponse();
      await api.modelCustomQuery(request, response);
      expect(response.statusCode).toBe(403);
      expect(response._getJSONData().message).toMatch(/Invalid group_by/);
    });

    it('- chart with an unknown sum field is rejected', async () => {
      const request = makeChartReq({ type: 'single_value', model: 'users', field: 'secret', operation: 'sum' });
      const response = httpMocks.createResponse();
      await api.modelCustomQuery(request, response);
      expect(response.statusCode).toBe(403);
    });

    it('- chart with a valid field works', async () => {
      const request = makeChartReq({ type: 'single_value', model: 'users', field: 'rating', operation: 'avg' });
      const response = httpMocks.createResponse();
      await api.modelCustomQuery(request, response);
      expect(response.statusCode).toBe(200);
      expect(typeof response._getJSONData().chart.data).toBe('number');
    });

    it('- ranking chart with an unknown relationship model returns a clean error', async () => {
      const request = makeChartReq({
        type: 'ranking', model: 'users', field: 'firstname',
        relationship_model: 'nope', relationship_model_ref_field: 'user_id', relationship_operation: 'count'
      });
      const response = httpMocks.createResponse();
      await api.modelCustomQuery(request, response);
      expect(response.statusCode).toBe(403);
      expect(response._getJSONData().message).toMatch(/Invalid relationship model/);
    });

    it('- ranking chart works', async () => {
      const request = makeChartReq({
        type: 'ranking', model: 'users', field: 'firstname',
        relationship_model: 'cars', relationship_model_ref_field: 'user_id', relationship_operation: 'count', limit: 5
      });
      const response = httpMocks.createResponse();
      await api.modelCustomQuery(request, response);
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response._getJSONData().chart.data)).toBe(true);
    });

    it('- invalid query body is rejected', async () => {
      const request = httpMocks.createRequest({ method: 'POST', body: {} });
      const response = httpMocks.createResponse();
      await api.modelCustomQuery(request, response);
      expect(response.statusCode).toBe(403);
    });

    it('- delete with an invalid ids parameter is rejected without crashing', async () => {
      const request = httpMocks.createRequest({ method: 'DELETE', params: { model: 'cars' }, body: { ids: 'nope' } });
      const response = httpMocks.createResponse();
      await api.modelDeleteSome(request, response);
      expect(response.statusCode).toBe(403);
    });
  });
};
