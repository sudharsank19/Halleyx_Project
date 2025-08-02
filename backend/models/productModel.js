const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  stock_quantity: { type: Number, required: true, min: 0 },
  image: { type: String, default: null }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
