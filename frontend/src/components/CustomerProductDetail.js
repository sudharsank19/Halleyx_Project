import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './CustomerProductDetail.css';

function CustomerProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError('Failed to load product details');
      }
    }
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (e) => {
    setQuantity(Math.max(1, Math.min(product.stock_quantity, Number(e.target.value))));
  };

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(item => item.product._id === product._id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity = Math.min(cart[existingIndex].quantity + quantity, product.stock_quantity);
    } else {
      cart.push({ product, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Added ${quantity} of ${product.name} to cart.`);
  };

  const handleBuyNow = () => {
    // Implement buy now functionality as needed
    alert(`Proceeding to buy ${quantity} of ${product.name}.`);
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!product) return <p>Loading product details...</p>;

  return (
    <div className="product-detail-container">
      <h1>{product.name}</h1>
      <img src={product.image || 'https://via.placeholder.com/300'} alt={product.name} className="product-image" />
      <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
      <p><strong>In Stock:</strong> {product.stock_quantity}</p>
      <p><strong>Description:</strong> {product.description}</p>
      <div className="quantity-addcart">
        <label htmlFor="quantity">Qty:</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          min="1"
          max={product.stock_quantity}
          onChange={handleQuantityChange}
        />
        <button onClick={handleAddToCart}>Add to Cart</button>
        <button className="buy-now-button" onClick={handleBuyNow}>Buy Now</button>
      </div>
    </div>
  );
}

export default CustomerProductDetail;
