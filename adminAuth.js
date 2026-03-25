const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
});

const cartSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  items:     [cartItemSchema],
  total:     { type: Number, default: 0 },
}, { timestamps: true });

cartSchema.methods.calculateTotal = function() {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return this.total;
};

module.exports = mongoose.model('Cart', cartSchema);
