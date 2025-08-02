import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';

function Checkout() {
  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    setError('');
    try {
      const impersonationToken = localStorage.getItem('impersonationToken');
      const token = impersonationToken || localStorage.getItem('token');
      if (!token) {
        setError('Please login to place an order.');
        return;
      }
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      if (cart.length === 0) {
        setError('Your cart is empty.');
        return;
      }
      const response = await axios.post('/api/orders', {
        items: cart,
        shippingAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Order placed successfully! Order ID: ${response.data.orderId}`);
      localStorage.removeItem('cart');
      navigate('/order-history');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form className="checkout-form">
        <div>
          <label>Shipping Address:</label>
          <input name="addressLine1" placeholder="Address Line 1" value={shippingAddress.addressLine1} onChange={handleChange} />
          <input name="addressLine2" placeholder="Address Line 2" value={shippingAddress.addressLine2} onChange={handleChange} />
          <input name="city" placeholder="City" value={shippingAddress.city} onChange={handleChange} />
          <input name="state" placeholder="State" value={shippingAddress.state} onChange={handleChange} />
          <input name="zip" placeholder="ZIP" value={shippingAddress.zip} onChange={handleChange} />
          <input name="country" placeholder="Country" value={shippingAddress.country} onChange={handleChange} />
          <input name="phone" placeholder="Phone" value={shippingAddress.phone} onChange={handleChange} />
        </div>
      </form>
      <button onClick={handlePlaceOrder}>Place Order</button>
    </div>
  );
}

export default Checkout;