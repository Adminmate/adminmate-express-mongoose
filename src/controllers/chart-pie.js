const Joi = require('joi');

module.exports = _conf => {
  const fnHelper = require('../helpers/functions')(_conf);

  const chartPie = async (currentModel, data) => {
    const paramsSchema = Joi.object({
      type: Joi.string().required(),
      model: Joi.string().required(),
      operation: Joi.string().required(),
      group_by: Joi.string().required(),
      field: Joi.alternatives().conditional('operation', {
        not: 'count',
        then: Joi.string().required(),
        otherwise: Joi.string().optional()
      }),
      limit: Joi.number().optional(),
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

    let _value = 1;
    if (data.field && ['sum', 'avg'].includes(data.operation)) {
      _value = `$${data.field}`;
    }

    // Filters
    let findParams = {};
    if (data.filters) {
      const filtersQuery = fnHelper.constructQuery(data.filters);
      if (filtersQuery) {
        findParams = filtersQuery;
      }
    }

    try {
      const repartitionData = await currentModel
        .aggregate([
          {
            $match: findParams
          },
          {
            $group: {
              _id: `$${data.group_by}`,
              count: data.operation === 'avg' ? { $avg: _value } : { $sum: _value },
            }
          },
          {
            $project: {
              key: '$_id',
              value: '$count',
              _id: false
            }
          }
        ])
        .sort({ key: 1 });

      return {
        success: true,
        data: {
          config: null,
          data: repartitionData
        }
      };
    }
    catch(e) {
      return {
        success: false,
        message: e.message
      };
    }
  };

  return chartPie;
};
