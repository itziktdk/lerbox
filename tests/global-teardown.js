const mongoose = require('mongoose');

module.exports = async function globalTeardown() {
  if (globalThis.__SERVER__) {
    await new Promise(resolve => globalThis.__SERVER__.close(resolve));
  }
  await mongoose.disconnect();
  if (globalThis.__MONGOD__) {
    await globalThis.__MONGOD__.stop();
  }
};
