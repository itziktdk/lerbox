const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-secret';
  process.env.PORT = '3001';

  // Store for teardown
  globalThis.__MONGOD__ = mongod;

  // Start app server
  const { startServer } = require('../server');
  globalThis.__SERVER__ = await startServer(uri);

  // Seed demo data
  const res = await fetch('http://localhost:3001/api/demo/seed', { method: 'POST' });
  const data = await res.json();
  console.log('Demo seeded:', data.logins);
};
