const Joi = require('@hapi/joi');

module.exports = async (currentModel, data) => {
  const paramsSchema = Joi.object({
    type: Joi.string().required(),
    model: Joi.string().required(),
    operation: Joi.string().required(),
    field: Joi.alternatives().conditional('operation', {
      not: 'count',
      then: Joi.string().required(),
      otherwise: Joi.string()
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

  try {
    if (data.operation === 'sum') {
      const sumData = await currentModel
        .aggregate([{
          $group: {
            _id: `$${data.group_by}`,
            count: {
              $sum: `$${data.field}`
            }
          }
        }]);

      if (!sumData || !sumData[0] || typeof sumData[0].count !== 'number') {
        return res.status(403).json();
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
        .aggregate([{
          $group: {
            _id: `$${data.group_by}`,
            avg: {
              $avg: `$${data.field}`
            }
          }
        }]);

      if (!avgData || !avgData[0] || typeof avgData[0].avg !== 'number') {
        return res.status(403).json();
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
    const dataCount = await currentModel.countDocuments({});

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