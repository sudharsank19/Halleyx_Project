import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrderHistory.css';

function OrderHistory() {
  const [orderHistory, setOrderHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrderHistory() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to view your orders.');
          return;
        }
        const response = await axios.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrderHistory(response.data);
      } catch (err) {
        setError('Failed to load order history');
      }
    }
    fetchOrderHistory();
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="order-history-container">
      <h2>My Orders</h2>
      {orderHistory.length === 0 ? (
        <p>You have no past orders.</p>
      ) : (
        <ul className="order-history-list">
          {orderHistory.map(order => (
            <li key={order._id}>
              <div>Order #{order._id} | Date: {new Date(order.date).toLocaleDateString()} | Status: {order.status}</div>
              <ul>
                {order.items.map(item => (
                  <li key={item.product?._id || item._id || Math.random()} className="order-item">
                    <img src={item.product?.image || 'https://via.placeholder.com/50'} alt={item.product?.name || 'Unknown Product'} className="order-item-image" />
                    <span className="order-item-name">{item.product?.name || 'Unknown Product'}</span>
                    <span className="order-item-qty">x{item.quantity}</span>
                    <span className="order-item-price">${(item.product?.price || 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OrderHistory;
