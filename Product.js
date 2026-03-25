const router  = require('express').Router();
const Cart    = require('../models/Cart');
const Product = require('../models/Product');

router.get('/:sessionId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ sessionId: req.params.sessionId }).populate('items.product');
    if (!cart) cart = await Cart.create({ sessionId: req.params.sessionId, items: [] });
    res.json({ success: true, data: cart });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:sessionId/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });

    let cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (!cart) cart = new Cart({ sessionId: req.params.sessionId, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ product: productId, quantity, price: product.price });

    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product');
    res.json({ success: true, data: cart });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:sessionId/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (!cart) return res.status(404).json({ success: false, message: 'السلة غير موجودة' });

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== productId);
    } else {
      const item = cart.items.find(i => i.product.toString() === productId);
      if (item) item.quantity = quantity;
    }
    cart.calculateTotal();
    await cart.save();
    await cart.populate('items.product');
    res.json({ success: true, data: cart });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:sessionId/remove/:productId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ sessionId: req.params.sessionId });
    if (!cart) return res.status(404).json({ success: false, message: 'السلة غير موجودة' });
    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    cart.calculateTotal();
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:sessionId/clear', async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ sessionId: req.params.sessionId }, { items: [], total: 0 });
    res.json({ success: true, message: 'تم تفريغ السلة' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
