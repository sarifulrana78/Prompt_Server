const mongoose = require('mongoose');
const Prompt = require('./models/Prompt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function seedPrompts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create the Premium Prompt
    const premiumPrompt = new Prompt({
      title: 'Cum et earum dolores',
      description: 'Qui veniam aut ad q',
      content: 'A futuristic city skyline with glowing neon lights, cyberpunk style, highly detailed, 8k resolution, cinematic lighting --v 6.0',
      category: 'IDEA GENERATION',
      aiTool: 'MIDJOURNEY',
      difficulty: 'Intermediate',
      visibility: 'Private',
      status: 'approved',
      creator: 'user_123', // dummy creator ID, will just render as a user
    });

    // Create the Free Prompt
    const freePrompt = new Prompt({
      title: 'Claude 3.5 Sonnet Fullstack Architect',
      description: 'Creates optimal database schemas and corresponding backend route templates with security validations.',
      content: 'Act as a senior fullstack architect. I need a database schema for a [APP_TYPE]. Please provide the Mongoose schema and the Express routes with basic validation.',
      category: 'CODING',
      aiTool: 'CLAUDE',
      difficulty: 'Pro',
      visibility: 'Public',
      status: 'approved',
      creator: 'user_123',
    });

    await premiumPrompt.save();
    console.log('Premium prompt added');

    await freePrompt.save();
    console.log('Free prompt added');

  } catch (error) {
    console.error('Error seeding prompts:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedPrompts();
