const mongoose = require('mongoose');
const fnHelper = require('../helpers/functions');

module.exports.get = async (req, res) => {
  const modelName = req.params.model;
  const items = req.query.ids || '';
  const target = req.query.target || '';

  if (!items || !['item', 'bulk'].includes(target)) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const currentModel = fnHelper.getModelObject(modelName);
  if (!currentModel || !items) {
    return res.status(403).json({ message: 'Invalid request' });
  }

  const currentModelSmartActions = fnHelper.getModelSmartActions(modelName);
  if (!currentModelSmartActions || currentModelSmartActions.length === 0) {
    return res.json({ list: [] });
  }

  // Ids list
  const itemsArray = items.split(',');

  // Get corresponding items
  const itemsDB = await currentModel
    .find({
      _id: {
        $in: itemsArray
      }
    })
    .lean();

  if (!itemsDB) {
    return res.json({ list: [] });
  }

  // Filter by target
  let smartActionsCopy = currentModelSmartActions.filter(sa => {
    const isStringAndValid = typeof sa.target === 'string' && sa.target === target;
    const isArrayAndValid = Array.isArray(sa.target) && sa.target.includes(target);
    return isStringAndValid || isArrayAndValid;
  });

  itemsDB.forEach(item => {
    smartActionsCopy.forEach(sa => {
      // If the filter do not pass, remove the smart actions from the list
      if (sa.filter(item) === false) {
        _.remove(smartActionsCopy, { code: sa.code });
      }
    });
  });

  res.json({ list: smartActionsCopy });
};