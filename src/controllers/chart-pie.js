module.exports = async (currentModel, data) => {
  let _value = 1;
  if (data.field && ['sum', 'avg'].includes(data.operation)) {
    _value = `$${data.field}`;
  }

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
};