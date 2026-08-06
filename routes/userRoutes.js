const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Prompt = require('../models/Prompt');
const { verifyAuth, verifyRole } = require('../middlewares/authMiddleware');

// Get current user profile
router.get('/profile', verifyAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const totalPrompts = await Prompt.countDocuments({ creator: req.user.id });
    
    res.json({ success: true, user, totalPrompts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's created prompts
router.get('/my-prompts', verifyAuth, async (req, res) => {
  try {
    const prompts = await Prompt.find({ creator: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, prompts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's saved prompts
router.get('/saved-prompts', verifyAuth, async (req, res) => {
  try {
    const prompts = await Prompt.find({ bookmarkedBy: req.user.id })
      .populate('creator', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, prompts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Route: Get all users
router.get('/admin/all', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Route: Change User Role
router.put('/admin/role/:id', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['User', 'Creator', 'Admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Route: Delete User
router.delete('/admin/:id', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    // Might also want to delete user's prompts or set them to a deleted state
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
