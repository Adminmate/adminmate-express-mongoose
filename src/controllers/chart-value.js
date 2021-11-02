module.exports = async (currentModel, data) => {
  if (data.operation === 'sum') {
    const sumData = await currentModel
      .aggregate([{
        $group: {
          _id: `$${data.group_by}`,
          count: { $sum: `$${data.field}` },
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
          avg: { $avg: `$${data.field}` },
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
  else {
    const dataCount = await currentModel.countDocuments({});

    return {
      success: true,
      data: {
        config: null,
        data: dataCount
      }
    };
  }
};