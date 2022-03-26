const Joi = require('@hapi/joi');

module.exports = async (currentModel, data) => {
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
    limit: Joi.number().optional()
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

  try {
    const repartitionData = await currentModel
      .aggregate([
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