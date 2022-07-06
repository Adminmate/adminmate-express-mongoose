const Joi = require('joi');

module.exports = _conf => {
  const fnHelper = require('../helpers/functions')(_conf);

  const chartValue = async (currentModel, data) => {
    const paramsSchema = Joi.object({
      type: Joi.string().required(),
      model: Joi.string().required(),
      operation: Joi.string().required(),
      field: Joi.alternatives().conditional('operation', {
        not: 'count',
        then: Joi.string().required(),
        otherwise: Joi.string()
      }),
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

    // Filters
    let findParams = {};
    if (data.filters) {
      const filtersQuery = fnHelper.constructQuery(data.filters);
      if (filtersQuery) {
        findParams = filtersQuery;
      }
    }

    try {
      if (data.operation === 'sum') {
        const sumData = await currentModel
          .aggregate([
            {
              $match: findParams
            },
            {
              $group: {
                _id: null,
                count: {
                  $sum: `$${data.field}`
                }
              }
            }
          ]);

        if (!sumData || !sumData[0] || typeof sumData[0].count !== 'number') {
          return {
            success: false,
            message: 'An error occurred'
          };
        }

        return {
          success: true,
          data: {
            config: null,
            data: sumData[0].count
          }
        };
      }
      else if (data.operation === 'avg') {
        const avgData = await currentModel
          .aggregate([
            {
              $match: findParams
            },
            {
              $group: {
                _id: null,
                avg: {
                  $avg: `$${data.field}`
                }
              }
            }
          ]);

        if (!avgData || !avgData[0] || typeof avgData[0].avg !== 'number') {
          return {
            success: false,
            message: 'An error occurred'
          };
        }

        return {
          success: true,
          data: {
            config: null,
            data: avgData[0].avg
          }
        };
      }

      // Simple count
      const dataCount = await currentModel.countDocuments(findParams);

      return {
        success: true,
        data: {
          config: null,
          data: dataCount
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

  return chartValue;
};
