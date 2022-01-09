const httpMocks = require('node-mocks-http');
const { customQuery } = require('../../src/controllers/model-query');

const makeChartReq = data => {
  return httpMocks.createRequest({
    method: 'POST',
    body: {
      data
    }
  });
};

it('Pie chart - Count', async () => {
  const request = makeChartReq({
    type: 'pie',
    model: 'users',
    field: '',
    group_by: 'rating',
    operation: 'count'
  });

  const response = httpMocks.createResponse();
  await customQuery(request, response, (err) => expect(err).toBeFalsy());

  const responseData = response._getJSONData();
  expect(response.statusCode).toBe(200);
  expect(responseData).toMatchSpecificSnapshot('./__snapshots__/chart-pie.shot');
});

['year', 'week', 'month', 'day'].forEach(timeframe => {
  it(`Bar/Lines chart - Simple ${timeframe}`, async () => {
    const request = makeChartReq({
      type: 'bar',
      model: 'users',
      field: 'createdAt',
      group_by: 'createdAt',
      timeframe: timeframe,
      operation: 'count',
      to: '2021-11-27'
    });

    const response = httpMocks.createResponse();
    await customQuery(request, response, (err) => expect(err).toBeFalsy());

    const responseData = response._getJSONData();
    expect(response.statusCode).toBe(200);
    expect(responseData).toMatchSpecificSnapshot(`./__snapshots__/chart-bar.shot`);
  });
});
