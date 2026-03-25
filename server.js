const router    = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const Order     = require('../models/Order');
const Product   = require('../models/Product');

router.use(adminAuth);

router.get('/orders/stats', async (req, res) => {
  try {
    const [totalOrders, pendingOrders, todayOrders, revenueResult] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } }),
      Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);
    res.json({ success: true, data: { totalOrders, pendingOrders, todayOrders, totalRevenue: revenueResult[0]?.total || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/orders', async (req, res) => {
  try {
    const { status, orderType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: orders, total: orders.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status, ...(adminNotes && { adminNotes }) }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable' });
    res.json({ success: true, data: product });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isAvailable: false });
    res.json({ success: true, message: 'Produit masqué' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
