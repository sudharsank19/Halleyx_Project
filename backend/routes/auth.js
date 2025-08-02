const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { findUserByEmail, addCustomer, updateUser, findUserById } = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Configure nodemailer transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sudharsank19052004@gmail.com',
    pass: 'xehdaptehpziqbrq'
  }
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
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
}

// Export router and middlewares
module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.checkRole = checkRole;

// New route to get branding settings for authenticated customer
router.get('/customer/branding', verifyToken, checkRole('customer'), async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ message: 'User not found' });
    }
    const branding = user.branding || {};
    res.json({
      logoUrl: branding.logoUrl || null,
      primaryColor: branding.primaryColor || '#FF5733',
      secondaryColor: branding.secondaryColor || '#00AACC',
      fontFamily: branding.fontFamily || 'Roboto',
      customHtml: branding.customHtml || '',
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch branding settings' });
  }
});

// ... existing routes unchanged ...
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email, 'admin');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer login
router.post('/customer/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email, 'customer');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer registration
router.post('/customer/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const newUser = await addCustomer({ email, password, firstName, lastName });
    const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get current customer profile
router.get('/customer/profile', verifyToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current customer profile
router.put('/customer/profile', verifyToken, async (req, res) => {
  const { firstName, lastName, email } = req.body;
  try {
    const user = await findUserById(req.user.id);
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ message: 'User not found' });
    }
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/customer/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  try {
    const user = await findUserById(req.user.id);
    if (!user || user.role !== 'customer') {
      return res.status(404).json({ message: 'User not found' });
    }
    const validPassword = await user.comparePassword(currentPassword);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password with email sending via Gmail including OTP in message
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await findUserByEmail(email, 'customer');
    if (!user) {
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(20).toString('hex');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = resetToken;
    user.otp = otp;
    user.otpExpiration = Date.now() + 10 * 60 * 1000; // 10 minutes
    await updateUser(user._id, { resetToken, otp, otpExpiration: user.otpExpiration });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}&otp=${otp}`;

    const mailOptions = {
      from: '"Support" <your_gmail_address@gmail.com>',
      to: email,
      subject: 'Password Reset',
      text: `You requested a password reset. Your OTP is ${otp}. Click the link to reset your password: ${resetLink}`,
      html: `<p>You requested a password reset.</p><p>Your OTP is <b>${otp}</b>.</p><p>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    res.json({ message: 'If this email is registered, a reset link has been sent.', resetToken });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const user = await findUserByEmail(email, 'customer');
    if (!user || user.otp !== otp || Date.now() > user.otpExpiration) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    res.json({ message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { email, token, otp, newPassword } = req.body;
  console.log('Reset password request body:', req.body);
  if (!email || !token || !newPassword) {
    console.log('Missing required fields:', { email, token, newPassword });
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const user = await findUserByEmail(email, 'customer');
    console.log('User found for reset:', user);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or token' });
    }
    if (user.resetToken !== token) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }
    
    // If OTP is provided, verify it
    if (otp !== undefined && otp !== null) {
      if (user.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      if (Date.now() > user.otpExpiration) {
        return res.status(400).json({ message: 'OTP expired' });
      }
    }
    
    user.password = newPassword;
    user.resetToken = undefined;
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Error resetting password:', err.stack || err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;

