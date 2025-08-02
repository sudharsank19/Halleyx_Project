const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  active: { type: Boolean, default: true },
  resetToken: { type: String, default: null },
  otp: { type: String, default: null },
  otpExpiration: { type: Date, default: null },
  branding: {
    logoUrl: { type: String, default: null },
    primaryColor: { type: String, default: '#FF5733' },
    secondaryColor: { type: String, default: '#00AACC' },
    fontFamily: { type: String, default: 'Roboto' },
    customHtml: { type: String, default: '' }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
