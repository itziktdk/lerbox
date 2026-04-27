try { require("dotenv").config(); } catch(e) {}

process.on('unhandledRejection', (err) => { console.error('Unhandled rejection:', err); });
process.on('uncaughtException', (err) => { console.error('Uncaught exception:', err); });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d', etag: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/behavior', require('./routes/behavior'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/demo', require('./routes/demo'));
app.use('/api/admin', require('./routes/admin'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server first, then connect MongoDB (so Azure health checks pass)
const PORT = process.env.PORT || 3000;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ No MONGODB_URI set — running without database');
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 5 });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Retry in background
    setTimeout(() => connectDB(), 10000);
  }
}

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`📦 LerBox running on port ${PORT}`);
    connectDB();
  });
}

async function startServer(mongoUri) {
  if (mongoUri) process.env.MONGODB_URI = mongoUri;
  await connectDB();
  return new Promise(resolve => {
    const server = app.listen(PORT, () => {
      console.log(`📦 LerBox running on port ${PORT}`);
      resolve(server);
    });
  });
}

module.exports = { app, startServer };
