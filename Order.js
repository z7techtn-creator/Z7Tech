const router = require('express').Router();
const Order  = require('../models/Order');
const Cart   = require('../models/Cart');

router.post('/', async (req, res) => {
  try {
    const { customer, sessionId, orderType, notes, shipping = 0 } = req.body;
    if (!customer?.name || !customer?.phone)
      return res.status(400).json({ success: false, message: 'الاسم والهاتف مطلوبان' });
    if (orderType === 'delivery' && !customer?.address)
      return res.status(400).json({ success: false, message: 'العنوان مطلوب للتوصيل' });

    const cart = await Cart.findOne({ sessionId }).populate('items.product');
    if (!cart || !cart.items.length)
      return res.status(400).json({ success: false, message: 'السلة فارغة' });

    const orderItems = cart.items.map(item => ({
      product:     item.product._id,
      productName: item.product.name,
      quantity:    item.quantity,
      price:       item.price,
    }));

    let pickupDeadline = null;
    if (orderType === 'pickup') {
      pickupDeadline = new Date();
      pickupDeadline.setDate(pickupDeadline.getDate() + 7);
    }

    const order = await Order.create({
      customer, items: orderItems,
      subtotal: cart.total, shipping,
      total: cart.total + shipping,
      orderType, notes, pickupDeadline,
    });

    await Cart.findOneAndUpdate({ sessionId }, { items: [], total: 0 });

    res.status(201).json({
      success: true,
      message: orderType === 'pickup'
        ? 'Réservation confirmée ! Récupérez votre commande dans 7 jours.'
        : 'Commande reçue ! Nous vous contacterons bientôt.',
      data: {
        orderNumber: order.orderNumber,
        orderId:     order._id,
        total:       order.total,
        orderType,
        pickupDeadline,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ success: false, message: 'Numéro de commande introuvable' });
    const statusMap = {
      pending: 'En attente', confirmed: 'Confirmée', processing: 'En préparation',
      shipped: 'En livraison', delivered: 'Livrée', cancelled: 'Annulée', ready_pickup: 'Prête à récupérer',
    };
    res.json({ success: true, data: { ...order._doc, statusLabel: statusMap[order.status] } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
