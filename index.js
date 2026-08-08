const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const cors = require('cors');
const dotenv = require('dotenv');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean);

    const isVercel = origin.endsWith('.vercel.app');
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    if (allowedOrigins.includes(origin) || isVercel || isLocalhost) {
      return callback(null, true);
    }

    callback(new Error('CORS policy: This origin is not allowed.'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn("MONGODB_URI is not defined. Please add it to .env");
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

connectDB();

const { auth } = require('./auth');
const { toNodeHandler } = require('better-auth/node');

// Mount better-auth
app.use('/api/auth', toNodeHandler(auth));

const promptRoutes = require('./routes/promptRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/prompts', promptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Routes
app.get('/', (req, res) => {
  res.send('AI Prompt Platform API is running...');
});

// Basic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
