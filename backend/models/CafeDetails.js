const mongoose = require('mongoose');

const cafeDetailsSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  logo: {
    type: String
  },
  gstNumber: {
    type: String,
    trim: true
  },
  cgst: {
    type: Number,
    default: 0
  },
  igst: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

cafeDetailsSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('CafeDetails', cafeDetailsSchema);
