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
  const smartActionsFilteredByTarget = currentModelSmartActions
    .filter(sa => {
      const isStringAndValid = typeof sa.target === 'string' && sa.target === target;
      const isArrayAndValid = Array.isArray(sa.target) && sa.target.includes(target);
      return isStringAndValid || isArrayAndValid;
    })
    .map(sa => {
      sa.passFilter = true;
      return sa;
    });

  itemsDB.forEach(item => {
    smartActionsFilteredByTarget.forEach(sa => {
      // If the filter do not pass, remove the smart actions from the list
      if (typeof sa.filter === 'function' && sa.filter(item) === false) {
        sa.passFilter = false;
      }
    });
  });

  // We only keep valid smart actions
  const finalSmartActions = smartActionsFilteredByTarget.filter(sa => sa.passFilter === true);

  res.json({ list: finalSmartActions });
};