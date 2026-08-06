const express = require('express');
const router = express.Router();
const Prompt = require('../models/Prompt');
const { verifyAuth, verifyRole } = require('../middlewares/authMiddleware');

// Get all public prompts with search, filter, sort and pagination
router.get('/', async (req, res) => {
  try {
    const { search, category, aiTool, difficulty, sort, page = 1, limit = 9 } = req.query;
    
    // Build query
    const query = { visibility: 'Public', status: 'approved' };
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (category) query.category = category;
    if (aiTool) query.aiTool = aiTool;
    if (difficulty) query.difficulty = difficulty;
    
    // Build sort
    let sortOptions = { createdAt: -1 };
    if (sort === 'popular') sortOptions = { copyCount: -1 }; // Or calculate by rating later
    if (sort === 'copies') sortOptions = { copyCount: -1 };
    if (sort === 'latest') sortOptions = { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const prompts = await Prompt.find(query)
      .populate('creator', 'name photoURL')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Prompt.countDocuments(query);
    
    res.json({
      success: true,
      prompts,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get featured prompts
router.get('/featured', async (req, res) => {
  try {
    const prompts = await Prompt.find({ visibility: 'Public', status: 'approved' })
      .populate('creator', 'name photoURL')
      .sort({ copyCount: -1 })
      .limit(6);
    res.json({ success: true, prompts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single prompt details (Private Route - user must be logged in to view details)
router.get('/:id', verifyAuth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id)
      .populate('creator', 'name email photoURL role');
      
    if (!prompt) {
      return res.status(404).json({ success: false, message: 'Prompt not found' });
    }
    
    // Check if prompt is private and user is not premium (and not the creator)
    if (prompt.visibility === 'Private' && 
        req.user.subscription !== 'Premium' && 
        prompt.creator._id.toString() !== req.user.id) {
      // Return prompt but without the actual content
      const safePrompt = prompt.toObject();
      safePrompt.content = 'PREMIUM_LOCKED';
      return res.json({ success: true, prompt: safePrompt, isLocked: true });
    }
    
    res.json({ success: true, prompt, isLocked: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a new prompt (User/Creator)
router.post('/', verifyAuth, async (req, res) => {
  try {
    // Check limit for free users
    if (req.user.subscription === 'Free' && req.user.role === 'User') {
      const count = await Prompt.countDocuments({ creator: req.user.id });
      if (count >= 3) {
        return res.status(403).json({ success: false, message: 'Free users can only add up to 3 prompts.' });
      }
    }
    
    const newPrompt = new Prompt({
      ...req.body,
      creator: req.user.id,
      status: 'pending',
      copyCount: 0
    });
    
    await newPrompt.save();
    res.status(201).json({ success: true, prompt: newPrompt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update a prompt (Creator only)
router.put('/:id', verifyAuth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (prompt.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const updatedPrompt = await Prompt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, prompt: updatedPrompt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete a prompt (Creator or Admin)
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (prompt.creator.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await Prompt.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Prompt deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bookmark / Unbookmark a prompt
router.post('/:id/bookmark', verifyAuth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Not found' });
    
    const index = prompt.bookmarkedBy.indexOf(req.user.id);
    if (index === -1) {
      prompt.bookmarkedBy.push(req.user.id);
    } else {
      prompt.bookmarkedBy.splice(index, 1);
    }
    
    await prompt.save();
    res.json({ success: true, isBookmarked: index === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Copy prompt (increment counter)
router.post('/:id/copy', verifyAuth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Not found' });
    
    // Check if locked
    if (prompt.visibility === 'Private' && 
        req.user.subscription !== 'Premium' && 
        prompt.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Premium required to copy' });
    }
    
    prompt.copyCount += 1;
    await prompt.save();
    res.json({ success: true, copyCount: prompt.copyCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
