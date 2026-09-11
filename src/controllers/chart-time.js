
const Joi = require('joi');
const _ = require('lodash');
const moment = require('moment');

module.exports = _conf => {
  const fnHelper = require('../helpers/functions')(_conf);

  const chartTime = async (currentModel, data) => {
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
      date_to: Joi.date().optional(),
      filters: Joi.object({
        operator: Joi.string().valid('and', 'or').required(),
        list: Joi.array().required()
      })
    });

    // Validate params
    const { error } = paramsSchema.validate(data);
    if (error) {
      return {
        success: false,
        message: error.details[0].message
      };
    }

    // Whitelist the fields against the schema
    if (!fnHelper.isValidFieldPath(currentModel, data.group_by)) {
      return { success: false, message: 'Invalid group_by field' };
    }
    if (data.field && !fnHelper.isValidFieldPath(currentModel, data.field)) {
      return { success: false, message: 'Invalid field' };
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

    // Filters
    let findParams = Object.keys(matchReq).length > 0 ? { [data.group_by]: matchReq } : {};
    if (data.filters) {
      const filtersQuery = fnHelper.constructQuery(data.filters);
      if (filtersQuery) {
        findParams = { $and: [findParams, filtersQuery] };
      }
    }

    let repartitionData;
    try {
      repartitionData = await currentModel
        .aggregate([
          {
            $match: findParams
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
      const unixRange = repartitionData.map(d => moment(d.key, momentFormat));
      const min = _.min(unixRange).clone();
      const max = _.max(unixRange).clone();

      // Pre-build a map keyed by formatted date to avoid O(n²) lookup
      const dataMap = new Map(repartitionData.map(d => {
        const key = moment(d.key, momentFormat).startOf(data.timeframe).format('YYYY-MM-DD');
        return [key, d.value];
      }));

      let currentDate = min;
      while (currentDate.isSameOrBefore(max)) {
        const dateKey = currentDate.format('YYYY-MM-DD');
        // Lookup with the same normalization as the map keys (matters for the 'week' timeframe)
        const matchingValue = dataMap.get(currentDate.clone().startOf(data.timeframe).format('YYYY-MM-DD'));
        const value = matchingValue !== undefined ? fnHelper.toFixedIfNecessary(matchingValue, 2) : 0;
        formattedData.push({
          key: dateKey,
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

  return chartTime;
};
