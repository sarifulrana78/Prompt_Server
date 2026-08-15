const mongoose = require('mongoose');
const Prompt = require('./models/Prompt');
const User = require('./models/User');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const seedPrompts = [];
const aiTools = ["ChatGPT", "Claude", "Gemini", "Midjourney", "Stable Diffusion"];
const categories = ["Coding", "Writing", "Marketing", "Graphics & Image", "Idea Generation", "System Assistant", "Other"];
const difficulties = ["Beginner", "Intermediate", "Pro"];

const baseTemplates = [
  // WRITING
  { title: "SEO Optimized Blog Post", category: "Writing", tags: ["seo", "blog", "content"], content: "Write an SEO optimized blog post about [Topic] targeting the keyword [Keyword]." },
  { title: "YouTube Video Script", category: "Writing", tags: ["youtube", "video", "script"], content: "Write a highly engaging 10-minute YouTube video script about [Topic] with a strong hook." },
  { title: "Creative Copywriting Formulas", category: "Writing", tags: ["copywriting", "creative", "framework"], content: "Generate 5 different creative copywriting variations using PAS, AIDA, and BAB frameworks for [Product]." },
  { title: "Professional Academic Essay", category: "Writing", tags: ["academic", "essay", "research"], content: "Write a comprehensive academic essay on [Topic] with citations in APA format." }, // Pro difficulty due to index % 3
  
  // MARKETING
  { title: "High-Converting Facebook Ad", category: "Marketing", tags: ["ads", "facebook", "marketing"], content: "Write a high-converting Facebook ad copy for [Product] targeting [Audience]." },
  { title: "Brand Voice Guidelines", category: "Marketing", tags: ["branding", "strategy", "voice"], content: "Create a brand voice and tone guideline for a company in the [Industry] sector." },
  { title: "Advanced SEO Strategy Planner", category: "Marketing", tags: ["seo", "strategy", "growth"], content: "Create a 6-month SEO content strategy for a website in the [Niche] niche to outrank competitors." },
  { title: "Viral TikTok Content Calendar", category: "Marketing", tags: ["tiktok", "viral", "social"], content: "Design a 30-day viral TikTok content calendar for a brand selling [Product]." },

  // CODING
  { title: "React Component Generator", category: "Coding", tags: ["react", "code", "typescript"], content: "Generate a React functional component using Tailwind CSS for [UI Element]." },
  { title: "Python Data Analysis Script", category: "Coding", tags: ["python", "data", "pandas"], content: "Write a Python script using pandas to analyze a dataset containing [Data Type]." },
  { title: "REST API Node.js Express", category: "Coding", tags: ["nodejs", "api", "express"], content: "Write a complete RESTful API using Node.js, Express, and MongoDB for [Resource]." },
  { title: "Docker Compose Setup", category: "Coding", tags: ["docker", "devops", "deploy"], content: "Create a production-ready docker-compose.yml file for a Node.js app with Redis and PostgreSQL." },

  // IDEA GENERATION
  { title: "Cold Email Sales Sequence", category: "Idea Generation", tags: ["sales", "email", "b2b"], content: "Write a 3-part cold email sequence for selling [Product] to [Audience]." },
  { title: "Startup Pitch Deck Outline", category: "Idea Generation", tags: ["startup", "pitch", "deck"], content: "Outline a 12-slide seed stage pitch deck for a startup building [Product]." },
  { title: "SaaS Product Feature Ideation", category: "Idea Generation", tags: ["saas", "product", "features"], content: "Brainstorm 10 innovative features for a SaaS platform focused on [Industry]." },

  // GRAPHICS & IMAGE
  { title: "Cinematic Product Photography", category: "Graphics & Image", tags: ["photography", "product", "render"], content: "Cinematic photography of [Product], 8k, photorealistic, cinematic lighting --ar 16:9" },
  { title: "Minimalist UI App Icon", category: "Graphics & Image", tags: ["ui", "icon", "design"], content: "Minimalist iOS app icon for a [App Type] app, flat design, vector, dribbble style --v 6.0" },
  { title: "Cyberpunk Cityscape Concept", category: "Graphics & Image", tags: ["cyberpunk", "concept", "art"], content: "Concept art of a futuristic cyberpunk city at night, neon lights, raining, highly detailed, octane render" },
  { title: "Fantasy Character Portrait", category: "Graphics & Image", tags: ["fantasy", "rpg", "character"], content: "Detailed portrait of a [Class] fantasy character, digital painting, trending on artstation" },

  // SYSTEM ASSISTANT
  { title: "Financial Model Projection", category: "System Assistant", tags: ["finance", "excel", "projection"], content: "Provide the formulas and structure to build a 3-year SaaS financial projection model." },
  { title: "Database Schema Architect", category: "System Assistant", tags: ["database", "schema", "sql"], content: "Design an optimal database schema for a complex e-commerce application." },
  { title: "Linux Server Hardening Guide", category: "System Assistant", tags: ["linux", "security", "sysadmin"], content: "Generate a step-by-step checklist to secure a new Ubuntu server." },

  // OTHER
  { title: "Language Translation Prompt", category: "Other", tags: ["translation", "language", "polyglot"], content: "Translate the following text into [Language] while preserving the casual, friendly tone." },
  { title: "Fitness Routine Generator", category: "Other", tags: ["fitness", "health", "workout"], content: "Create a 4-day split workout routine for a beginner focusing on [Goal]." },
  { title: "Weekly Meal Prep Planner", category: "Other", tags: ["food", "mealprep", "diet"], content: "Design a healthy weekly meal prep plan for someone with a [Diet Type] diet." },
  { title: "Travel Itinerary Builder", category: "Other", tags: ["travel", "vacation", "planner"], content: "Build a comprehensive 7-day travel itinerary for a family visiting [Destination]." }
];

// Generate 60 prompts (15 per AI tool)
for (let i = 0; i < aiTools.length; i++) {
  const tool = aiTools[i];
  // 15 prompts per tool based on the 15 templates
  for (let j = 0; j < baseTemplates.length; j++) {
    const template = baseTemplates[j];
    seedPrompts.push({
      title: `${template.title} for ${tool}`,
      description: `A powerful prompt optimized for ${tool} to generate ${template.title.toLowerCase()}.`,
      content: template.content,
      category: template.category,
      aiTool: tool,
      tags: template.tags,
      difficulty: difficulties[j % 3],
      visibility: j % 5 === 0 ? "Private" : "Public",
      status: "approved",
      copyCount: Math.floor(Math.random() * 500) + 10,
      isFeatured: j % 4 === 0
    });
  }
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing prompts
    await Prompt.deleteMany({});
    console.log("Cleared existing prompts");

    // Find a user or create a dummy one
    let user = await User.findOne({});
    if (!user) {
      console.log("No users found. Creating a dummy admin user...");
      user = new User({
        name: "Admin User",
        email: "admin@example.com",
        role: "Admin",
        subscription: "Premium"
      });
      await user.save();
    }

    // Add creator ID to prompts
    const promptsWithCreator = seedPrompts.map(p => ({
      ...p,
      creator: user._id
    }));

    await Prompt.insertMany(promptsWithCreator);
    console.log(`Successfully added ${promptsWithCreator.length} prompts`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
