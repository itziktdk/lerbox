require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Connect MongoDB and start server (only when run directly)
async function startServer(mongoUri) {
  const uri = mongoUri || process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => console.log(`📦 LerBox running on port ${PORT}`));
  return server;
}

if (require.main === module) {
  startServer().catch(err => console.error('Startup error:', err));
}

module.exports = { app, startServer };
