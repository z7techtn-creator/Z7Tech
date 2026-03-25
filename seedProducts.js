const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  nameAr:      { type: String },
  description: { type: String },
  price:       { type: Number, required: true },
  oldPrice:    { type: Number, default: null },
  image:       { type: String, default: null },
  icon:        { type: String, default: null },
  category:    { type: String, enum: ['laptop','smartphone','tablet','accessory','audio','gaming','mobilite'], default: 'accessory' },
  brand:       { type: String },
  stock:       { type: Number, default: 10 },
  isAvailable: { type: Boolean, default: true },
  rating:      { type: Number, default: 4.5 },
  badge:       { type: String, default: null },
  wide:        { type: Boolean, default: false },
  specs:       { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
