const express = require('express');
const router = express.Router();
const Prompt = require('../models/Prompt');
const Report = require('../models/Report');
const User = require('../models/User');
const Review = require('../models/Review');
const { verifyAuth, verifyRole } = require('../middlewares/authMiddleware');

// Get all prompts for admin (with pagination)
router.get('/prompts', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const prompts = await Prompt.find()
      .populate('creator', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Prompt.countDocuments();
    res.json({ success: true, prompts, total, totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve/Reject/Feature prompt
router.put('/prompts/:id/status', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const updateData = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    const prompt = await Prompt.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, prompt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Feature / unfeature a prompt
router.put('/prompts/:id/feature', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Not found' });
    prompt.isFeatured = !prompt.isFeatured;
    await prompt.save();
    res.json({ success: true, prompt, isFeatured: prompt.isFeatured });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a prompt (Admin)
router.delete('/prompts/:id', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    await Prompt.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Prompt deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics Dashboard
router.get('/analytics', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPrompts = await Prompt.countDocuments();
    const totalReviews = await Review.countDocuments();
    
    // Total copies aggregation
    const copiesAgg = await Prompt.aggregate([
      { $group: { _id: null, total: { $sum: '$copyCount' } } }
    ]);
    const totalCopies = copiesAgg.length > 0 ? copiesAgg[0].total : 0;

    // Prompt growth by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const promptGrowth = await Prompt.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Copies by category
    const copiesByCategory = await Prompt.aggregate([
      { $group: { _id: '$category', copies: { $sum: '$copyCount' }, count: { $sum: 1 } } },
      { $sort: { copies: -1 } },
    ]);
    
    res.json({ success: true, analytics: { totalUsers, totalPrompts, totalReviews, totalCopies, promptGrowth, copiesByCategory } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users for admin
router.get('/users', verifyAuth, verifyRole('Admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
