const fnHelper = require('../helpers/functions');

module.exports.getAll = async (req, res) => {
  const list = [];

  global._amConfig.models.forEach(modelConfig => {
    const currentModelCustomActions = fnHelper.getModelCustomActions(modelConfig.slug);
    if (currentModelCustomActions && currentModelCustomActions.length) {
      currentModelCustomActions.map(sa => {
        list.push({
          model: modelConfig.slug,
          label: sa.label,
          code: sa.code
        });
      });
    }
  });

  res.json({ list });
};

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

  // Get model options
  const currentModelOptions = fnHelper.getModelOptions(modelName);
  const cannotDelete = currentModelOptions && currentModelOptions.canDelete === false;

  const actionsList = [];
  if (!cannotDelete) {
    actionsList.push({
      label: target === 'item' ? 'Delete item' : 'Delete items',
      code: 'delete'
    });
  }

  const currentModelCustomActions = fnHelper.getModelCustomActions(modelName);
  if (!currentModelCustomActions || currentModelCustomActions.length === 0) {
    return res.json({ list: actionsList });
  }

  // Ids list
  const itemsArray = items.split(',');

  // Get corresponding items
  const itemsDB = await currentModel
    .find({ _id: { $in: itemsArray } })
    .lean();

  if (!itemsDB) {
    return res.json({ list: actionsList });
  }

  // Filter by target
  const customActionsFilteredByTarget = currentModelCustomActions
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
    customActionsFilteredByTarget.forEach(sa => {
      // If the filter do not pass, remove the custom actions from the list
      if (typeof sa.filter === 'function' && sa.filter(item) === false) {
        sa.passFilter = false;
      }
    });
  });

  // We only keep valid custom actions
  const finalCustomActions = customActionsFilteredByTarget.filter(sa => sa.passFilter === true);

  res.json({ list: [...actionsList, ...finalCustomActions] });
};