const mongoose = require("mongoose");

async function withMongoTransaction(operation) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => operation(session));
  } finally {
    await session.endSession();
  }
}

module.exports = withMongoTransaction;
