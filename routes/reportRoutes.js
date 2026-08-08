const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Prompt = require('../models/Prompt');
const { verifyAuth } = require('../middlewares/authMiddleware');

router.post('/', verifyAuth, async (req, res) => {
  try {
    const { promptId, reason, description } = req.body;
    const prompt = await Prompt.findById(promptId);
    if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found.' });

    const report = new Report({
      prompt: promptId,
      user: req.user.id,
      reason,
      description,
    });
    await report.save();

    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', verifyAuth, async (req, res) => {
  try {
    const reports = await Report.find().populate('prompt', 'title').populate('user', 'name email');
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/status', verifyAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
