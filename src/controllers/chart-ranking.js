const fnHelper = require('../helpers/functions');

module.exports = async (currentModel, data) => {
  // Get relationship model
  const relationshipModel = fnHelper.getModelObject(data.relationship_model);
  if (!relationshipModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  // Default limit
  let limit = data.limit || 10;

  let _value = 1;
  if (data.relationship_field && ['sum', 'avg'].includes(data.relationship_operation)) {
    _value = `$${data.relationship_field}`;
  }

  const repartitionData = await relationshipModel
    .aggregate([
      {
        $group: {
          _id: `$${data.relationship_model_ref_field}`,
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
    .limit(limit)
    .sort({ value: -1 });

  const parentIds = repartitionData.map(d => d.key);
  const parentData = await currentModel.find({ _id: parentIds }).select(data.field).lean();

  repartitionData.forEach(d => {
    d.item_model = data.model;
    d.item_id = d.key;
    const parent = parentData.find(p => p._id.toString() === d.key.toString());
    if (parent) {
      d.key = parent[data.field];
    }
  });

  return {
    success: true,
    data: {
      config: null,
      data: repartitionData
    }
  };
};