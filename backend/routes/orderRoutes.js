const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Get all orders for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { restaurantId: req.params.restaurantId };
    if (status) {
      filter.status = status;
    }
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.menuItemId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItemId')
      .populate('restaurantId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const orderNumber = 'ORD' + Date.now();
    const order = new Order({
      ...req.body,
      orderNumber
    });
    
    // Calculate totals if not provided
    if (!order.subtotal) {
      order.subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    if (!order.tax) {
      order.tax = order.subtotal * 0.1; // 10% tax
    }
    if (!order.total) {
      order.total = order.subtotal + order.tax;
    }
    
    const savedOrder = await order.save();
    
    // Emit Socket.io event for real-time notification
    const io = req.app.get('io');
    console.log('Socket.io instance available:', !!io);
    console.log('Emitting to restaurant:', order.restaurantId.toString());
    
    if (io) {
      const eventData = {
        order: savedOrder,
        message: `New order received: ${orderNumber}`,
        timestamp: new Date()
      };
      
      console.log('Emitting new-order event:', eventData);
      io.to(order.restaurantId.toString()).emit('new-order', eventData);
      console.log('Event emitted successfully');
    } else {
      console.log('Socket.io not available');
    }
    
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: Date.now(),
        ...(status === 'completed' && { actualPreparationTime: Math.floor((Date.now() - order.createdAt) / 60000) })
      },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
