module.exports.getIn = async ids => {
  // Get corresponding items
  const items = await currentModel
    .find({ _id: { $in: ids } })
    .lean();

  return items;
};