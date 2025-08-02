import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './ProductForm.css';

function ProductForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      // Fetch product details for editing
      const fetchProduct = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/admin/products/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const product = response.data;
          setName(product.name);
          setDescription(product.description);
          setPrice(product.price);
          setStockQuantity(product.stock_quantity);
          // Image is not set here because file input cannot be prefilled
        } catch (err) {
          setError('Failed to fetch product details');
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('stock_quantity', stockQuantity);
      if (image) {
        formData.append('image', image);
      }

      const token = localStorage.getItem('token');

      if (id) {
        // Update existing product
        await axios.put(`/api/admin/products/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Create new product
        await axios.post('/api/admin/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      }

      navigate('/admin-products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  return (
    <div className="product-form-container">
      <form onSubmit={handleSubmit} className="product-form">
        <h2>{id ? 'Edit Product' : 'Add Product'}</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={4}
          />
        </div>
        <div className="form-group">
          <label>Price:</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label>Stock Quantity:</label>
          <input
            type="number"
            value={stockQuantity}
            onChange={e => setStockQuantity(e.target.value)}
            required
            min="0"
          />
        </div>
        <div className="form-group">
          <label>Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setImage(e.target.files[0])}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default ProductForm;
