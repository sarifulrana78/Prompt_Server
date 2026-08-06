const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  photoURL: {
    type: String,
  },
  role: {
    type: String,
    enum: ['User', 'Creator', 'Admin'],
    default: 'User',
  },
  subscription: {
    type: String,
    enum: ['Free', 'Premium'],
    default: 'Free',
  },
  // fields required by better-auth
  emailVerified: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true, collection: 'user' });

module.exports = mongoose.model('User', userSchema);
