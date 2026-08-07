const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  aiTool: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Pro'],
    required: true,
  },
  thumbnail: {
    type: String,
  },
  visibility: {
    type: String,
    enum: ['Public', 'Private'],
    default: 'Public',
  },
  copyCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  creator: {
    type: String,
    ref: 'User',
    required: true,
  },
  bookmarkedBy: [{
    type: String,
    ref: 'User',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Prompt', promptSchema);
