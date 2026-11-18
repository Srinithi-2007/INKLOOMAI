const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { connectToMongo } = require("../services/mongoConnection");

test("MongoDB connection fails explicitly when its URI is missing", async () => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  try {
    await assert.rejects(connectToMongo(), /MONGODB_URI is not configured/);
  } finally {
    if (originalUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalUri;
  }
});

test("concurrent requests reuse the same MongoDB connection attempt", async () => {
  const originalUri = process.env.MONGODB_URI;
  const originalConnect = mongoose.connect;
  const originalReadyState = mongoose.connection.readyState;
  let connectCalls = 0;
  process.env.MONGODB_URI = "mongodb://example.invalid/inkloom";
  mongoose.connection.readyState = 0;
  mongoose.connect = async () => {
    connectCalls += 1;
    mongoose.connection.readyState = 2;
    await Promise.resolve();
    mongoose.connection.readyState = 1;
    return mongoose;
  };

  try {
    const [first, second] = await Promise.all([
      connectToMongo(),
      connectToMongo(),
    ]);
    assert.equal(connectCalls, 1);
    assert.equal(first, mongoose.connection);
    assert.equal(second, mongoose.connection);
  } finally {
    mongoose.connect = originalConnect;
    mongoose.connection.readyState = originalReadyState;
    if (originalUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalUri;
  }
});
