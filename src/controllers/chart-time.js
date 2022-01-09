
const _ = require('lodash');
const moment = require('moment');

module.exports = async (currentModel, data) => {
  if (!['day', 'week', 'month', 'year'].includes(data.timeframe)) {
    return {
      success: false,
      message: 'Invalid timeframe'
    };
  }

  const toSum = data.field && data.operation === 'sum' ? `$${data.field}` : 1;

  // To set the max date
  const toDate = data.to ? moment(data.to) : moment();

  let matchReq = {};
  let groupFormat = '';

  // Day timeframe
  if (data.timeframe === 'day') {
    const startOfCurrentDay = toDate.startOf('day');
    matchReq = {
      '$gte': new Date(startOfCurrentDay.clone().subtract(30, 'day').startOf('day').format()),
      '$lt': new Date(startOfCurrentDay.format())
    };
    groupFormat = '%Y-%m-%d';
  }
  // Week timeframe
  else if (data.timeframe === 'week') {
    const startOfCurrentWeek = toDate.startOf('week');
    matchReq = {
      '$gte': new Date(startOfCurrentWeek.clone().subtract(26, 'week').startOf('week').format()),
      '$lt': new Date(startOfCurrentWeek.format())
    };
    groupFormat = '%V';
  }
  // Month timeframe
  else if (data.timeframe === 'month') {
    const startOfCurrentMonth = toDate.startOf('month');
    matchReq = {
      '$gte': new Date(startOfCurrentMonth.clone().subtract(12, 'month').startOf('month').format()),
      '$lt': new Date(startOfCurrentMonth.format())
    };
    groupFormat = '%m';
  }
  // Year timeframe
  else if (data.timeframe === 'year') {
    const startOfCurrentYear = toDate.startOf('year');
    matchReq = {
      '$gte': new Date(startOfCurrentYear.clone().subtract(8, 'year').startOf('year').format()),
      '$lt': new Date(startOfCurrentYear.format())
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
    for (let i = 1; i <= 30; i++) {
      const currentDate = toDate.clone().subtract(i, 'day').startOf('day');
      const countForTheTimeframe = _.find(repartitionData, { key: currentDate.format('YYYY-MM-DD') });
      formattedData.push({
        key: currentDate.format('DD/MM'),
        value: countForTheTimeframe ? countForTheTimeframe.value : 0
      });
    }
  }
  // Week timeframe
  else if (data.timeframe === 'week') {
    for (let i = 1; i <= 26; i++) {
      const currentWeek = toDate.clone().subtract(i, 'week').startOf('week');
      const countForTheTimeframe = _.find(repartitionData, { key: currentWeek.format('WW') });
      formattedData.push({
        key: currentWeek.startOf('week').format('DD/MM'),
        value: countForTheTimeframe ? countForTheTimeframe.value : 0
      });
    }
  }
  // Month timeframe
  else if (data.timeframe === 'month') {
    for (let i = 1; i <= 12; i++) {
      const currentMonth = toDate.clone().subtract(i, 'month').startOf('month');
      const countForTheTimeframe = _.find(repartitionData, { key: currentMonth.format('MM') });
      formattedData.push({
        key: currentMonth.startOf('month').format('MMM'),
        value: countForTheTimeframe ? countForTheTimeframe.value : 0
      });
    }
  }
  // Year timeframe
  else if (data.timeframe === 'year') {
    for (let i = 1; i <= 8; i++) {
      const currentYear = toDate.clone().subtract(i, 'year').startOf('year');
      const countForTheTimeframe = _.find(repartitionData, { key: currentYear.format('YYYY') });
      formattedData.push({
        key: currentYear.startOf('year').format('YYYY'),
        value: countForTheTimeframe ? countForTheTimeframe.value : 0
      });
    }
  }

  const formattedDataOrdered = formattedData.reverse();

  const chartConfig = {
    xaxis: [
      { dataKey: 'key' }
    ],
    yaxis: [
      { dataKey: 'value' },
      // { dataKey: 'test', orientation: 'right' }
    ]
  };

  return {
    success: true,
    data: {
      config: chartConfig,
      data: formattedDataOrdered
    }
  };
};