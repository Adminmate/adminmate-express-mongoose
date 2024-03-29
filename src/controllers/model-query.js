const _ = require('lodash');
const moment = require('moment');
const fnHelper = require('../helpers/functions');

module.exports.customQuery = async (req, res) => {
  const data = req.body.data;
  const modelName = data.model;

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  if (data.type === 'pie') {
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

    res.json({ data: repartitionData });
  }
  else if (data.type === 'single_value' || data.type === 'objective') {
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

      res.json({ data: sumData[0].count });
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

      res.json({ data: avgData[0].avg });
    }
    else {
      const dataCount = await currentModel.countDocuments({});
      res.json({ data: dataCount });
    }
  }
  else if (data.type === 'bar' || data.type === 'line') {
    const toSum = data.field && data.operation === 'sum' ? `$${data.field}` : 1;

    let matchReq = {};
    let groupFormat = '';

    // Day timeframe
    if (data.timeframe === 'day') {
      matchReq = {
        '$gte': new Date(moment().subtract(30, 'day').startOf('day').format()),
        '$lte': new Date(moment().endOf('day').format())
      };
      groupFormat = '%Y-%m-%d';
    }
    // Week timeframe
    else if (data.timeframe === 'week') {
      matchReq = {
        '$gte': new Date(moment().subtract(26, 'week').startOf('week').format()),
        '$lte': new Date(moment().endOf('week').format())
      };
      groupFormat = '%V';
    }
    // Month timeframe
    else if (data.timeframe === 'month') {
      matchReq = {
        '$gte': new Date(moment().subtract(12, 'month').startOf('month').format()),
        '$lte': new Date(moment().endOf('month').format())
      };
      groupFormat = '%m';
    }
    // Year timeframe
    else if (data.timeframe === 'year') {
      matchReq = {
        '$gte': new Date(moment().subtract(8, 'year').startOf('year').format()),
        '$lte': new Date(moment().endOf('year').format())
      };
      groupFormat = '%Y';
    }

    if (!groupFormat) {
      return res.status(403).json({ message: 'Invalid request' });
    }

    const repartitionData = await currentModel
      .aggregate([
        {
          $match: {
            [data.group_by]: matchReq
          }
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

    const formattedData = [];

    // Day timeframe
    if (data.timeframe === 'day') {
      for (let i = 0; i < 30; i++) {
        const currentDate = moment().subtract(i, 'day');
        const countForTheTimeframe = _.find(repartitionData, { key: currentDate.format('YYYY-MM-DD') });
        formattedData.push({
          key: currentDate.format('DD/MM'),
          value: countForTheTimeframe ? countForTheTimeframe.value : 0
        });
      }
    }
    // Week timeframe
    else if (data.timeframe === 'week') {
      for (let i = 0; i < 26; i++) {
        const currentWeek = moment().subtract(i, 'week');

        const countForTheTimeframe = _.find(repartitionData, { key: currentWeek.format('WW') });
        formattedData.push({
          key: currentWeek.startOf('week').format('DD/MM'),
          value: countForTheTimeframe ? countForTheTimeframe.value : 0
        });
      }
    }
    // Month timeframe
    else if (data.timeframe === 'month') {
      for (let i = 0; i < 12; i++) {
        const currentMonth = moment().subtract(i, 'month');

        const countForTheTimeframe = _.find(repartitionData, { key: currentMonth.format('MM') });
        formattedData.push({
          key: currentMonth.startOf('month').format('MMM'),
          value: countForTheTimeframe ? countForTheTimeframe.value : 0
        });
      }
    }
    // Year timeframe
    else if (data.timeframe === 'year') {
      for (let i = 0; i < 8; i++) {
        const currentYear = moment().subtract(i, 'year');

        const countForTheTimeframe = _.find(repartitionData, { key: currentYear.format('YYYY') });
        formattedData.push({
          key: currentYear.startOf('year').format('YYYY'),
          value: countForTheTimeframe ? countForTheTimeframe.value : 0
        });
      }
    }

    formattedDataOrdered = formattedData.reverse();

    const finalData = {
      config: {
        xaxis: [
          { dataKey: 'key' }
        ],
        yaxis: [
          { dataKey: 'value' },
          // { dataKey: 'test', orientation: 'right' }
        ]
      },
      data: formattedDataOrdered
    };

    res.json({ data: finalData });
  }
  else {
    res.json({ data: null });
  }
};