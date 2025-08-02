const express = require('express');
const router = express.Router();
const { listProducts, getProductById } = require('../models/product');

// Public route to list products without authentication
router.get('/', async (req, res) => {
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

// Public route to get product details by id without authentication
router.get('/:id', async (req, res) => {
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

module.exports = router;
