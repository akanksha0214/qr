const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login user
router.post('/login', async (req, res) => {
  try {
    //take input from user
    const { email, password } = req.body;

    //check for user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "User not found" });

    //check for credential
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ msg: "Invalid Credentials" });

    //assign token to user
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: "lax",
      domain: "localhost", // Explicitly set domain for localhost
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log("Cookie set with token:", token);
    console.log("Cookie settings:", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 24 * 60 * 60 * 1000
    });

    //all good->login
    res.json({
      success: true,
      user: { id: user._id, name: user.name, role: user.role, restaurantId: user.restaurantId, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().populate('restaurantId', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('restaurantId', 'name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    console.log('Received user data:', req.body);
    const { name, email, password, role, restaurantId } = req.body;

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    console.log('Creating user with data:', { name, email, role, restaurantId });
    const user = await User.create({
      name,
      email,
      password: hashedPassword, // ✅ save hash
      role,
      restaurantId,
    });
    console.log('User created successfully:', user);

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: "Registration failed", details: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('restaurantId', 'name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
