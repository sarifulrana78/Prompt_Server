const mongoose = require('mongoose');
const Prompt = require('./models/Prompt');
const User = require('./models/User');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const seedPrompts = [];
const aiTools = ["ChatGPT", "Claude", "Gemini", "Midjourney"];
const categories = ["Marketing", "Development", "Writing", "Design", "Business"];
const difficulties = ["Beginner", "Intermediate", "Pro"];

const baseTemplates = [
  { title: "SEO Optimized Blog Post", category: "Writing", tags: ["seo", "blog", "content"], content: "Write an SEO optimized blog post about [Topic] targeting the keyword [Keyword]." },
  { title: "High-Converting Facebook Ad", category: "Marketing", tags: ["ads", "facebook", "marketing"], content: "Write a high-converting Facebook ad copy for [Product] targeting [Audience]." },
  { title: "React Component Generator", category: "Development", tags: ["react", "code", "typescript"], content: "Generate a React functional component using Tailwind CSS for [UI Element]." },
  { title: "Cold Email Sales Sequence", category: "Business", tags: ["sales", "email", "b2b"], content: "Write a 3-part cold email sequence for selling [Product] to [Audience]." },
  { title: "Cinematic Product Photography", category: "Design", tags: ["photography", "product", "render"], content: "Cinematic photography of [Product], 8k, photorealistic, cinematic lighting --ar 16:9" },
  { title: "Python Data Analysis Script", category: "Development", tags: ["python", "data", "pandas"], content: "Write a Python script using pandas to analyze a dataset containing [Data Type]." },
  { title: "Brand Voice Guidelines", category: "Marketing", tags: ["branding", "strategy", "voice"], content: "Create a brand voice and tone guideline for a company in the [Industry] sector." },
  { title: "YouTube Video Script", category: "Writing", tags: ["youtube", "video", "script"], content: "Write a highly engaging 10-minute YouTube video script about [Topic] with a strong hook." },
  { title: "Startup Pitch Deck Outline", category: "Business", tags: ["startup", "pitch", "deck"], content: "Outline a 12-slide seed stage pitch deck for a startup building [Product]." },
  { title: "Minimalist UI App Icon", category: "Design", tags: ["ui", "icon", "design"], content: "Minimalist iOS app icon for a [App Type] app, flat design, vector, dribbble style --v 6.0" },
  { title: "Advanced SEO Strategy Planner", category: "Marketing", tags: ["seo", "strategy", "growth"], content: "Create a 6-month SEO content strategy for a website in the [Niche] niche to outrank competitors." },
  { title: "REST API Node.js Express", category: "Development", tags: ["nodejs", "api", "express"], content: "Write a complete RESTful API using Node.js, Express, and MongoDB for [Resource]." },
  { title: "Creative Copywriting Formulas", category: "Writing", tags: ["copywriting", "creative", "framework"], content: "Generate 5 different creative copywriting variations using PAS, AIDA, and BAB frameworks for [Product]." },
  { title: "Financial Model Projection", category: "Business", tags: ["finance", "excel", "projection"], content: "Provide the formulas and structure to build a 3-year SaaS financial projection model." },
  { title: "Cyberpunk Cityscape Concept", category: "Design", tags: ["cyberpunk", "concept", "art"], content: "Concept art of a futuristic cyberpunk city at night, neon lights, raining, highly detailed, octane render" }
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
