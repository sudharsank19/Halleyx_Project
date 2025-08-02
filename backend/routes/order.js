const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const { verifyToken, checkRole } = require('./auth'); // Assuming checkRole middleware is exported from auth.js

// Create new order
router.post('/', verifyToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    const order = new Order({
      customer: customerId,
      items,
      shippingAddress,
      status: 'Pending',
      date: new Date()
    });

    await order.save();

    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// Get orders for current customer
router.get('/', verifyToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const orders = await Order.find({ customer: customerId }).populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Admin routes for order management

const mongoose = require('mongoose');

// Get all orders with filtering
router.get('/admin/orders', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { status, dateFrom, dateTo, customer } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        filter.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.date.$lte = new Date(dateTo);
      }
    }

    if (customer) {
      // Search customer by name or email
      const customerRegex = new RegExp(customer, 'i');
      const customers = await mongoose.model('User').find({
        $or: [
          { firstName: customerRegex },
          { lastName: customerRegex },
          { email: customerRegex }
        ]
      }).select('_id');
      filter.customer = { $in: customers.map(c => c._id) };
    }

    const orders = await Order.find(filter)
      .populate('customer', 'firstName lastName email')
      .populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/admin/orders/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// Update order by ID
router.put('/admin/orders/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { status, shippingAddress, items } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (status) order.status = status;
    if (shippingAddress) order.shippingAddress = shippingAddress;
    if (items) order.items = items;

    await order.save();
    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// Delete order by ID
router.delete('/admin/orders/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete order' });
  }
});

module.exports = router;
