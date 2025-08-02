require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const publicProductsRoutes = require('./routes/publicProducts');
const orderRoutes = require('./routes/order');
const { seedAdmin } = require('./models/user');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/halleyx_project';

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    await seedAdmin();
    console.log('Admin user seeded');

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // Configure multer storage
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadsDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });
    const upload = multer({ storage });

    app.use(bodyParser.json());

    // Serve uploaded images statically
    app.use('/uploads', express.static(uploadsDir));

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', verifyToken, checkRole('admin'), adminRoutes);
    app.use('/api/products', publicProductsRoutes); // Public products route without auth
    app.use('/api/orders', verifyToken, orderRoutes); // Protected order routes

    // Protected route example
    app.get('/api/admin/dashboard', verifyToken, checkRole('admin'), (req, res) => {
      res.json({ message: 'Welcome to the admin dashboard' });
    });

    app.get('/api/customer/dashboard', verifyToken, checkRole('customer'), (req, res) => {
      res.json({ message: 'Welcome to the customer dashboard' });
    });

    // Middleware to verify JWT token
    function verifyToken(req, res, next) {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return res.status(401).json({ message: 'No token provided' });

      const token = authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });
        req.user = decoded;
        next();
      });
    }

    // Middleware to check user role
    function checkRole(role) {
      return (req, res, next) => {
        if (req.user.role !== role) {
          return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        }
        next();
      };
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
  }
}

module.exports = { app, io };

startServer();
