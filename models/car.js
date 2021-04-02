const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CarSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String
  },
  manufacturer: {
    type: String
  },
  year: {
    type: Number
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Car', CarSchema, 'cars');
