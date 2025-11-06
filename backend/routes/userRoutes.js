const express = require('express');
const User = require('../models/User');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verifyJWT = require('../middleware/verifyJWT');

// ===========================
// REGISTER USER
// ===========================
router.post('/register', async (req, res) => {
  const { email, password, role, name, username, location, citizenId, avatar } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: 'User already exists' });

    const user = new User({
      email,
      password, // pre-save hook hashes it
      role,
      name,
      username,
      location,
      citizenId,
      avatar: avatar || "", // Cloudinary URL
    });

    await user.save();

    res.status(201).json({
      _id: user.id,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===========================
// LOGIN USER
// ===========================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        token,
        avatar: user.avatar || null, // Cloudinary URL
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===========================
// GET PROFILE
// ===========================
router.get('/profile', verifyJWT, async (req, res) => {
  try {
    console.log('Request User:', req.user);
    const user = await User.findById(req.user._id).select('-password'); // Use req.user._id
    console.log('Fetched Profile User:', user);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user); // avatar is Cloudinary URL
  } catch (err) {
    console.error('Profile Fetch Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ===========================
// UPDATE PROFILE
// ===========================
router.put('/profile', verifyJWT, async (req, res) => {
  const { name, username, email, password, location, avatar } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    user.name = name || user.name;
    user.username = username || user.username;
    user.email = email || user.email;
    user.location = location || user.location;

    if (avatar) {
      user.avatar = avatar; // Cloudinary URL
    }

    if (password) {
      user.password = password; // pre-save hook hashes it
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
