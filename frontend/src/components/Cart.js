import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);
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

  const handleDelete = (productId) => {
    const updatedItems = cartItems.filter(item => item.product?._id !== productId);
    setCartItems(updatedItems);
    updateCartStorage(updatedItems);
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Image</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Subtotal</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.length === 0 ? (
            <tr><td colSpan="6">Your cart is empty.</td></tr>
          ) : (
            cartItems.map(item => (
              <tr key={item.product?._id || item._id || Math.random()}>
                <td>{item.product?.name || 'Unknown Product'}</td>
                <td>
                  <img src={item.product?.image || 'https://via.placeholder.com/50'} alt={item.product?.name || 'Unknown Product'} className="cart-product-image" />
                </td>
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
                <td>
                  <button onClick={() => handleDelete(item.product?._id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="cart-total">
        <strong>Total: </strong>${totalAmount.toFixed(2)}
      </div>
      <button onClick={handleCheckout} disabled={cartItems.length === 0}>Checkout</button>
    </div>
  );
}

export default Cart;
