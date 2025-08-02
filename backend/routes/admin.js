const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  listProducts
} = require('../models/product');

// Configure multer storage for this router
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

async function getOrderStatusCounts() {
  const counts = await Order.aggregate([
    {
      $group: {
        _id: { $toLower: "$status" },
        count: { $sum: 1 }
      }
    }
  ]);
  const result = {
    pending: 0,
    processing: 0,
    shipped: 0
  };
  counts.forEach(c => {
    if (c._id === 'pending') result.pending = c.count;
    else if (c._id === 'completed' || c._id === 'complete') result.processing = c.count;
    else if (c._id === 'in progress') result.shipped = c.count;
    else if (c._id === 'processing') result.processing += c.count; // in case processing also exists
    else if (c._id === 'shipped') result.shipped += c.count; // in case shipped also exists
  });
  return result;
}

// Dynamic data for dashboard stats
router.get('/dashboard-data', async (req, res) => {
  try {
    const { total: totalProducts } = await listProducts({ page: 1, pageSize: 1, filter: '' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const orders = await getOrderStatusCounts();

    res.json({
      totalProducts,
      totalCustomers,
      orders
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Public route to list products without authentication
router.get('/products/public', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 20;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder || 'asc';
    const filter = req.query.filter || '';

    const result = await listProducts({ page, pageSize, sortBy, sortOrder, filter });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list products' });
  }
});

// List products with pagination, sorting, filtering (protected)
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 20;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder || 'asc';
    const filter = req.query.filter || '';

    const result = await listProducts({ page, pageSize, sortBy, sortOrder, filter });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list products' });
  }
});

// Get product details
router.get('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get product' });
  }
});

// Create product with image upload
router.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock_quantity } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const product = await createProduct({ name, description, price, stock_quantity, image });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update product with image upload
router.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, price, stock_quantity } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    const product = await updateProduct(id, { name, description, price, stock_quantity, image });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await deleteProduct(id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get all customers with optional search and status filter
router.get('/adminCustomers', async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = { role: 'customer' };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      filter.active = true;
    } else if (status === 'inactive') {
      filter.active = false;
    }

    const customers = await User.find(filter).select('-password -resetToken -otp -otpExpiration');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// Create new customer
router.post('/adminCustomers', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existingUser = await User.findOne({ email, role: 'customer' });
    if (existingUser) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }
    const newUser = new User({
      email,
      password,
      role: 'customer',
      firstName,
      lastName,
      active: true
    });
    await newUser.save();
    res.status(201).json({ message: 'Customer created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create customer' });
  }
});

// Get order history for a customer
router.get('/adminCustomers/:id/orders', async (req, res) => {
  try {
    const customerId = req.params.id;
    const orders = await require('../models/orderModel').find({ customer: customerId });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order history' });
  }
});

// Update customer profile fields and status
router.put('/adminCustomers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { firstName, lastName, email, isActive } = req.body;
    const customer = await User.findById(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    if (firstName !== undefined) customer.firstName = firstName;
    if (lastName !== undefined) customer.lastName = lastName;
    if (email !== undefined) customer.email = email;
    if (isActive !== undefined) customer.active = isActive;
    await customer.save();
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer' });
  }
});

// Update customer status (active/inactive)
router.put('/adminCustomers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { isActive } = req.body;
    const customer = await User.findById(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    customer.active = isActive;
    await customer.save();
    res.json({ message: 'Customer status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer status' });
  }
});

// Reset customer password and send temporary password
router.post('/adminCustomers/:id/reset-password', async (req, res) => {
  try {
    const id = req.params.id;
    const customer = await User.findById(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    customer.password = await bcrypt.hash(tempPassword, salt);
    await customer.save();

    // TODO: Send tempPassword to customer's email (not implemented)

    res.json({ tempPassword });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

const logger = require('console');

// Delete customer
router.delete('/adminCustomers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const customer = await User.findById(id);
    if (!customer || customer.role !== 'customer') {
      logger.error(`Delete customer failed: Customer not found with id ${id}`);
      return res.status(404).json({ message: 'Customer not found' });
    }
    await User.deleteOne({ _id: id });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    logger.error(`Delete customer error: ${err.message}\n${err.stack}`);
    res.status(500).json({ message: 'Failed to delete customer' });
  }
});

// Impersonate customer - generate token
router.post('/adminCustomers/:id/impersonate', async (req, res) => {
  try {
    const id = req.params.id;
    const customer = await User.findById(id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const token = jwt.sign({ id: customer._id, role: 'customer' }, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Failed to impersonate customer' });
  }
});

  // Remove duplicate fs and path require statements if already declared at the top
// Multer storage for branding logo uploads
const brandingStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/branding');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const brandingUpload = multer({ storage: brandingStorage });

// GET branding settings for a customer
router.get('/adminCustomers/:id/branding', async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await User.findById(customerId);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    // Assuming branding settings are stored in customer.branding (JSON)
    const branding = customer.branding || {};
    res.json({
      logoUrl: branding.logoUrl || null,
      primaryColor: branding.primaryColor || '#FF5733',
      secondaryColor: branding.secondaryColor || '#00AACC',
      fontFamily: branding.fontFamily || 'Roboto',
      customHtml: branding.customHtml || '',
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch branding settings' });
  }
});

// POST save branding settings for a customer
router.post('/adminCustomers/:id/branding', brandingUpload.single('logo'), async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await User.findById(customerId);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Prepare branding object
    const branding = customer.branding || {};

    if (req.file) {
      // Save logo URL relative to uploads folder
      branding.logoUrl = `/uploads/branding/${req.file.filename}`;
    }
    if (req.body.primaryColor) branding.primaryColor = req.body.primaryColor;
    if (req.body.secondaryColor) branding.secondaryColor = req.body.secondaryColor;
    if (req.body.fontFamily) branding.fontFamily = req.body.fontFamily;
    if (req.body.customHtml) branding.customHtml = req.body.customHtml;

    customer.branding = branding;
    await customer.save();

    // Emit socket event to notify customer of branding update
    const io = require('../server').io;
    io.to(customer._id.toString()).emit('brandingUpdated', { branding });

    res.json({ message: 'Branding settings saved successfully' });
  } catch (err) {
    console.error('Error saving branding settings:', err);
    res.status(500).json({ message: 'Failed to save branding settings' });
  }
});

module.exports = router;
