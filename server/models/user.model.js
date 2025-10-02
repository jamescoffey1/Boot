const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  balance: {
    type: Number,
    default: 0
  },
  usdBalance: {
    type: Number,
    default: 0
  },
  btcAddress: {
    type: String,
    default: ''
  },
  processedTransactions: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User; 