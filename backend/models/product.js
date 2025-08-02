const Product = require('./productModel');

// Create product
async function createProduct({ name, description, price, stock_quantity, image }) {
  if (!name) throw new Error('Name is required');
  if (price <= 0) throw new Error('Price must be greater than 0');
  if (stock_quantity < 0) throw new Error('Stock quantity cannot be negative');

  const product = new Product({
    name,
    description: description || '',
    price,
    stock_quantity,
    image: image || null
  });
  await product.save();
  return product;
}

// Get product by id
async function getProductById(id) {
  return Product.findById(id);
}

// Update product
async function updateProduct(id, { name, description, price, stock_quantity, image }) {
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');

  if (name !== undefined) {
    if (!name) throw new Error('Name is required');
    product.name = name;
  }
  if (description !== undefined) {
    product.description = description;
  }
  if (price !== undefined) {
    if (price <= 0) throw new Error('Price must be greater than 0');
    product.price = price;
  }
  if (stock_quantity !== undefined) {
    if (stock_quantity < 0) throw new Error('Stock quantity cannot be negative');
    product.stock_quantity = stock_quantity;
  }
  if (image !== undefined) {
    product.image = image;
  }
  await product.save();
  return product;
}

// Delete product
async function deleteProduct(id) {
  console.log('Attempting to delete product with id:', id);
  const product = await Product.findById(id);
  if (!product) {
    console.log('Product not found for id:', id);
    throw new Error('Product not found');
  }
  await Product.deleteOne({ _id: id });
  console.log('Product deleted:', id);
}

// List products with pagination, sorting, filtering
async function listProducts({ page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc', filter = '' }) {
  const query = {};
  if (filter) {
    query.name = { $regex: filter, $options: 'i' };
  }
  const total = await Product.countDocuments(query);
  const items = await Product.find(query)
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  return { total, items };
}

module.exports = {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  listProducts
};
