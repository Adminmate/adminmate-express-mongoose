const httpMocks = require('node-mocks-http');

const makeUsersReq = (method, data, headers = {}) => {
  return httpMocks.createRequest({
    method,
    params: {
      model: 'users'
    },
    headers,
    query: data,
    body: data
  });
};

const makeCarsReq = (method, data, headers = {}) => {
  return httpMocks.createRequest({
    method,
    params: {
      model: 'cars'
    },
    headers,
    query: data,
    body: data
  });
};

module.exports = api => {
  describe('Users request', () => {
    it('- No parameter', async () => {
      const request = makeUsersReq('GET', {});

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });
  });

  describe('Cars request', () => {
    it('- No parameter', async () => {
      const request = makeCarsReq('GET', {});

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });

    it('- With refFields params', async () => {
      const request = makeCarsReq('GET', {}, {
        'am-ref-fields': {
          users: 'firstname lastname'
        }
      });

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });

    it('- With "fields" parameter (name & manufacturer only)', async () => {
      const request = makeCarsReq('GET', {}, {
        'am-model-fields': ['name', 'manufacturer']
      });

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });

    it('- With "page" parameter set to 2', async () => {
      const request = makeCarsReq('GET', {
        page: 2
      });

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });

    it('- With a "search" parameter', async () => {
      const request = makeCarsReq('GET', {
        search: 'Porsche 91'
      }, {
        'am-model-fields': ['name']
      });

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });

    it('- With a "order" parameter', async () => {
      const request = makeCarsReq('GET', {
        search: 'Porsche 91',
        order: [['name', 'ASC']]
      }, {
        'am-model-fields': ['name']
      });

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });

    it('- With a "filters" parameter', async () => {
      const request = makeCarsReq('GET', {
        search: 'Porsche',
        filters: {
          operator: 'or',
          list: [
            { field: 'year', operator: 'is', value: 1968 },
            { field: 'year', operator: 'is', value: 1969 }
          ]
        }
      }, {
        'am-model-fields': ['name', 'year']
      });

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });

    it('- With a "segment" parameter', async () => {
      const request = makeCarsReq('GET', {
        segment: {
          type: 'code',
          data: 'ferrari'
        }
      }, {
        'am-model-fields': ['name', 'year']
      });

      const response = httpMocks.createResponse();
      await api.modelGetAll(request, response, (err) => expect(err).toBeFalsy());

      const responseData = response._getJSONData();
      expect(response.statusCode).toBe(200);
      expect(responseData).toMatchSpecificSnapshot('./mongodb/__snapshots__/model-getall.shot');
    });
  });
};
