const User = require('./userModel');

// Seed admin user
async function seedAdmin() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
  if (!existingAdmin) {
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      active: true
    });
    await adminUser.save();
    console.log('Admin user seeded');
  } else {
    // Update password to ensure it is hashed correctly
    existingAdmin.password = adminPassword;
    await existingAdmin.save();
    console.log('Admin user password updated');
  }
}

// Find user by email and role
async function findUserByEmail(email, role) {
  return User.findOne({ email, role });
}

// Add new customer user
async function addCustomer({ email, password, firstName, lastName }) {
  const existingUser = await User.findOne({ email, role: 'customer' });
  if (existingUser) {
    throw new Error('User already exists');
  }
  const newUser = new User({
    email,
    password,
    role: 'customer',
    firstName,
    lastName,
    active: true
  });
  await newUser.save();
  return newUser;
}

// Find user by id
async function findUserById(id) {
  return User.findById(id);
}

// Update user fields
async function updateUser(id, fields) {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  Object.assign(user, fields);
  await user.save();
  return user;
}

// Delete user
async function deleteUser(id) {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  await user.remove();
}

module.exports = {
  seedAdmin,
  findUserByEmail,
  addCustomer,
  findUserById,
  updateUser,
  deleteUser
};
