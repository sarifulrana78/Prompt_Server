const express = require('express');
const router = express.Router();
const Prompt = require('../models/Prompt');
const Report = require('../models/Report');
const User = require('../models/User');
const { verifyAuth, verifyRole } = require('../middlewares/authMiddleware');

// Get all prompts for admin
router.get('/prompts', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const prompts = await Prompt.find().populate('creator', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, prompts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve/Reject prompt
router.put('/prompts/:id/status', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const prompt = await Prompt.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, prompt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics Dashboard
router.get('/analytics', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPrompts = await Prompt.countDocuments();
    
    // Total copies aggregation
    const copiesAgg = await Prompt.aggregate([
      { $group: { _id: null, total: { $sum: '$copyCount' } } }
    ]);
    const totalCopies = copiesAgg.length > 0 ? copiesAgg[0].total : 0;
    
    res.json({ success: true, analytics: { totalUsers, totalPrompts, totalCopies } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
