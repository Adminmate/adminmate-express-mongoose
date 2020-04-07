const fnHelper = require('../helpers/functions');

module.exports.get = async (req, res, models) => {
  const modelName = req.params.model;
  // const submodelName = req.params.submodel;
  const search = req.body.search;
  const filters = req.body.filters;
  const page = parseInt(req.query.page || 1);
  // const subSection = req.query.subsection;
  const nbItemPerPage = 10;

  const currentModel = models.find(m => m.collection.name === modelName);
  if (!currentModel) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const keys = fnHelper.getModelProperties(currentModel);
  console.log('==model keys properties', keys);

  const fieldPopulateConfig = {
    client_id: 'firstname lastname'
  };
  let fieldsToPopulate = [];
  const fieldsToFetch = ['_id', 'firstname', 'lastname', 'client_id'];
  fieldsToFetch.forEach(field => {
    const matchingField = keys.find(k => k.path === field);
    if (matchingField && matchingField.type === 'ObjectID' && matchingField.ref) {
      fieldsToPopulate.push({
        path: field,
        select: fieldPopulateConfig[field] ? fieldPopulateConfig[field] : '_id'
      });
    }
  });

  let params = {};
  if (search) {
    params = {
      $or: [
        { firstname: { '$regex': `${search}`, '$options': 'i' } },
        { lastname: { '$regex': `${search}`, '$options': 'i' } },
        { email: { '$regex': `${search}`, '$options': 'i' } }
      ]
    };

    // If the search is a valid mongodb _id
    if (mongoose.Types.ObjectId.isValid(search)) {
      params.$or.push({ _id: search });
      params.$or.push({ dev_id: search });
      params.$or.push({ business_id: search });
      params.$or.push({ from_id: search });
      params.$or.push({ to_id: search });
    }
  }
  if (filters && filters.length) {
    const filter = filters[0];
    params[filter.attr] = filter.value;
  }

  // if (submodelName && subSections) {
  //   const fetchSubSection = subSections.find(s => s.code === submodelName);
  //   if (fetchSubSection && fetchSubSection.query) {
  //     params = {$and: [params, fetchSubSection.query] };
  //   }
  // }

  let data = await currentModel
    .find(params)
    .select('')
    .populate(fieldsToPopulate)
    .sort('-created_date')
    .skip(nbItemPerPage * (page - 1))
    .limit(nbItemPerPage)
    .lean();

  // console.log('===data', data);

  const dataCount = await currentModel.countDocuments(params);
  const nbPage = Math.ceil(dataCount / nbItemPerPage);

  // Make ref fields appeared as link in the dashboard
  data = data.map(item => {
    const attributes = Object.keys(item);
    attributes.forEach(attr => {
      const matchingField = fieldsToPopulate.find(field => field.path === attr);
      if (matchingField) {
        const label = matchingField.select === '_id' ? item[attr]._id : matchingField.select.replace(/[a-z]+/gi, word => {
          return item[attr][word];
        });
        item[attr] = {
          type: 'ref',
          id: item[attr]._id,
          label
        };
      }
    });
    return item;
  });

  // Properties cleaning
  const finalData = [];
  data.forEach(d => {
    const item = {};
    const listKeys = Object.keys(d);
    listKeys.forEach(k => {
      item[k] = typeof d[k] === 'undefined' ? '' : d[k];
    });
    finalData.push(item);
  });

  res.json({
    data: finalData,
    count: dataCount,
    pagination: {
      current: page,
      count: nbPage
    }
  });
}