const httpMocks = require('node-mocks-http');
const { getAll } = require('../../src/controllers/model-getall');

const makeUsersReq = data => {
  return httpMocks.createRequest({
    method: 'POST',
    params: {
      model: 'users'
    },
    body: data
  });
};

const makeCarsReq = data => {
  return httpMocks.createRequest({
    method: 'POST',
    params: {
      model: 'cars'
    },
    body: data
  });
};

describe('Users request', () => {
  it('- No parameter', async () => {
    const request = makeUsersReq({});

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });
});

describe('Cars request', () => {
  it('- No parameter', async () => {
    const request = makeCarsReq({});

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });

  it('- With refFields params', async () => {
    const request = makeCarsReq({
      refFields: {
        users: 'firstname lastname'
      }
    });

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });

  it('- With "fields" parameter (name & manufacturer only)', async () => {
    const request = makeCarsReq({
      fields: ['name', 'manufacturer']
    });

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });

  it('- With "page" parameter set to 2', async () => {
    const request = makeCarsReq({
      page: 2
    });

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });

  it('- With a "search" parameter', async () => {
    const request = makeCarsReq({
      fields: ['name'],
      search: 'Porsche 91'
    });

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });

  it('- With a "order" parameter', async () => {
    const request = makeCarsReq({
      fields: ['name'],
      search: 'Porsche 91',
      order: [['name', 'ASC']]
    });

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });

  it('- With a "filters" parameter', async () => {
    const request = makeCarsReq({
      fields: ['name', 'year'],
      search: 'Porsche',
      filters: {
        operator: 'or',
        list: [
          { field: 'year', operator: 'is', value: 1968 },
          { field: 'year', operator: 'is', value: 1969 }
        ]
      }
    });

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });

  it('- With a "segment" parameter', async () => {
    const request = makeCarsReq({
      fields: ['name', 'year'],
      segment: {
        type: 'code',
        data: 'ferrari'
      }
    });

    const response = httpMocks.createResponse();
    await getAll(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot('./__snapshots__/model-getall.shot');
  });
});