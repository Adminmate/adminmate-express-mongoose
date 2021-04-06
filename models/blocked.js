const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockedSchema = new Schema({
  blocked_id: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'blocked_model'
  },
  blocked_model: {
    type: String,
    required: true,
    enum: ['User', 'Car']
  }
});

module.exports = mongoose.model('Blocked', BlockedSchema, 'blocked');
