
const Joi = require('joi');
const _ = require('lodash');
const moment = require('moment');
const fnHelper = require('../helpers/functions');

module.exports = async (currentModel, data) => {
  const paramsSchema = Joi.object({
    type: Joi.string().required(),
    model: Joi.string().required(),
    operation: Joi.string().required(),
    group_by: Joi.string().required(),
    timeframe: Joi.string().required().valid('day', 'week', 'month', 'year'),
    field: Joi.alternatives().conditional('operation', {
      not: 'count',
      then: Joi.string().required(),
      otherwise: Joi.string()
    }),
    limit: Joi.number().optional(),
    date_from: Joi.date().optional(),
    date_to: Joi.date().optional()
  });

  // Validate params
  const { error } = paramsSchema.validate(data);
  if (error) {
    return {
      success: false,
      message: error.details[0].message
    };
  }

  const toSum = data.field && data.operation === 'sum' ? `$${data.field}` : 1;

  let matchReq = {};
  let groupFormat = '';

  if (data.date_from) {
    matchReq['$gte'] = new Date(moment(data.date_from));
  }

  if (data.date_to) {
    matchReq['$lt'] = new Date(moment(data.date_to));
  }

  // Day timeframe
  if (data.timeframe === 'day') {
    groupFormat = '%Y-%m-%d 00:00:00';
  }
  // Week timeframe
  else if (data.timeframe === 'week') {
    groupFormat = '%Y-%V';
  }
  // Month timeframe
  else if (data.timeframe === 'month') {
    groupFormat = '%Y-%m-01 00:00:00';
  }
  // Year timeframe
  else if (data.timeframe === 'year') {
    groupFormat = '%Y-01-01 00:00:00';
  }

  if (!groupFormat) {
    return {
      success: false,
      message: 'Invalid request'
    };
  }

  let repartitionData;
  try {
    repartitionData = await currentModel
      .aggregate([
        {
          $match: Object.keys(matchReq).length > 0 ? {
            [data.group_by]: matchReq
          } : {}
        },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: `$${data.group_by}` } },
            count: { $sum: toSum }
          }
        },
        {
          $project: {
            key: '$_id',
            value: '$count',
            _id: false
          }
        }
      ]);
  }
  catch(e) {
    return {
      success: false,
      message: e.message
    };
  }

  const formattedData = [];
  if (repartitionData && repartitionData.length > 0) {
    // Get min & max date in the results
    const momentFormat = data.timeframe === 'week' ? 'YYYY-WW' : 'YYYY-MM-DD HH:mm:ss';
    const unixRange = repartitionData.map(data => moment(data.key, momentFormat));
    const min = _.min(unixRange).clone();
    const max = _.max(unixRange).clone();

    let currentDate = min;
    while (currentDate.isSameOrBefore(max)) {
      const countForTheTimeframe = repartitionData.find(d => moment(d.key, momentFormat).isSame(currentDate, data.timeframe));
      const value = countForTheTimeframe ? fnHelper.toFixedIfNecessary(countForTheTimeframe.value, 2) : 0;
      formattedData.push({
        key: currentDate.format('YYYY-MM-DD'),
        value
      });
      currentDate.add(1, data.timeframe).startOf('day');
    }
  }

  const chartConfig = {
    xaxis: [
      { dataKey: 'key' }
    ],
    yaxis: [
      { dataKey: 'value' }
    ]
  };

  return {
    success: true,
    data: {
      config: chartConfig,
      data: formattedData
    }
  };
};
