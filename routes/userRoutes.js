const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Prompt = require('../models/Prompt');
const Review = require('../models/Review');
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

// Get user's reviews
router.get('/my-reviews', verifyAuth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('prompt', 'title category aiTool')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Creator analytics
router.get('/creator-analytics', verifyAuth, async (req, res) => {
  try {
    const prompts = await Prompt.find({ creator: req.user.id });
    const totalPrompts = prompts.length;
    const totalCopies = prompts.reduce((acc, p) => acc + (p.copyCount || 0), 0);
    const totalBookmarks = prompts.reduce((acc, p) => acc + (p.bookmarkedBy?.length || 0), 0);

    // Reviews count
    const promptIds = prompts.map(p => p._id);
    const totalReviews = await Review.countDocuments({ prompt: { $in: promptIds } });

    // Metrics per prompt (for BarChart)
    const metricsChart = prompts.slice(0, 8).map(p => ({
      name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
      copies: p.copyCount || 0,
      bookmarks: p.bookmarkedBy?.length || 0,
    }));

    // Generate Accumulative Growth data for the AreaChart (mocked over last 7 days based on current totals to match UI prototype)
    const accumulativeGrowth = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Interpolate from 0 to current totals
      const multiplier = (7 - i) / 7;
      accumulativeGrowth.push({
        date: dateStr,
        TotalPrompts: Math.floor(totalPrompts * multiplier),
        TotalCopies: Math.floor(totalCopies * multiplier),
      });
    }

    // Prompt growth by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const promptGrowth = await Prompt.aggregate([
      { $match: { creator: req.user.id, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, analytics: { totalPrompts, totalCopies, totalBookmarks, totalReviews, metricsChart, accumulativeGrowth, promptGrowth } });
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
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
