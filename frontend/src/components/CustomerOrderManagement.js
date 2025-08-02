import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerOrderManagement.css';

function CustomerOrderManagement() {
  const [cartItems, setCartItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: ''
  });
  const [orderSummary, setOrderSummary] = useState(null);
  const [error, setError] = useState('');
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' or 'checkout' or 'orderHistory'

  useEffect(() => {
    // Load cart items from localStorage
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);

    // TODO: Fetch order history from backend on mount
  }, []);

  const updateCartStorage = (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    const updatedItems = cartItems.map(item =>
      item.product?._id === productId
        ? { ...item, quantity: Math.min(quantity, item.product?.stock_quantity || 0) }
        : item
    );
    setCartItems(updatedItems);
    updateCartStorage(updatedItems);
  };

  const handleCheckout = () => {
    // TODO: Validate cart and proceed to checkout
    setCheckoutStep('checkout');
  };

  const handlePlaceOrder = () => {
    // TODO: Submit order with shipping address and cart items
    setCheckoutStep('orderHistory');
  };

  const handleShippingAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="order-management-container">
      {checkoutStep === 'cart' && (
        <>
          <h2>Your Cart</h2>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.length === 0 ? (
                <tr><td colSpan="4">Your cart is empty.</td></tr>
              ) : (
                cartItems.map(item => (
                  <tr key={item.product?._id || item._id || Math.random()}>
                    <td>{item.product?.name || 'Unknown Product'}</td>
                    <td>${(item.product?.price || 0).toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={item.product?.stock_quantity || 0}
                        value={item.quantity}
                        onChange={e => handleQuantityChange(item.product?._id, Number(e.target.value))}
                      />
                    </td>
                    <td>${((item.product?.price || 0) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="cart-total">
            <strong>Total: </strong>${totalAmount.toFixed(2)}
          </div>
          <button onClick={handleCheckout} disabled={cartItems.length === 0}>Checkout</button>
        </>
      )}

      {checkoutStep === 'checkout' && (
        <>
          <h2>Checkout</h2>
          <form className="checkout-form">
            <div>
              <label>Shipping Address:</label>
              <input name="addressLine1" placeholder="Address Line 1" value={shippingAddress.addressLine1} onChange={handleShippingAddressChange} />
              <input name="addressLine2" placeholder="Address Line 2" value={shippingAddress.addressLine2} onChange={handleShippingAddressChange} />
              <input name="city" placeholder="City" value={shippingAddress.city} onChange={handleShippingAddressChange} />
              <input name="state" placeholder="State" value={shippingAddress.state} onChange={handleShippingAddressChange} />
              <input name="zip" placeholder="ZIP" value={shippingAddress.zip} onChange={handleShippingAddressChange} />
              <input name="country" placeholder="Country" value={shippingAddress.country} onChange={handleShippingAddressChange} />
              <input name="phone" placeholder="Phone" value={shippingAddress.phone} onChange={handleShippingAddressChange} />
            </div>
          </form>
          <div className="order-summary">
            <h3>Order Summary:</h3>
            {/* TODO: Display order summary */}
          </div>
          <button onClick={handlePlaceOrder}>Place Order</button>
        </>
      )}

      {checkoutStep === 'orderHistory' && (
        <>
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
                      <li key={item.product?._id || item._id || Math.random()}>{item.product?.name || 'Unknown Product'} x{item.quantity} - ${(item.product?.price || 0).toFixed(2)}</li>
                    ))}
                  </ul>
                  <button onClick={() => handleViewDetails(order)}>View Details</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {selectedOrder && (
        <div className="order-details-modal">
          <div className="order-details-content">
            <h3>Order Details - #{selectedOrder._id}</h3>
            <p><strong>Date:</strong> {new Date(selectedOrder.date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <h4>Items:</h4>
            <ul>
              {selectedOrder.items.map(item => (
                <li key={item.product?._id || item._id || Math.random()}>
                  {item.product?.name || 'Unknown Product'} x{item.quantity} - ${(item.product?.price || 0).toFixed(2)}
                </li>
              ))}
            </ul>
            <button onClick={handleCloseDetails}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerOrderManagement;
