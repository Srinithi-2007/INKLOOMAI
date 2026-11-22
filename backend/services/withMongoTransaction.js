const mongoose = require("mongoose");

async function withMongoTransaction(operation) {
  let session;
  try {
    session = await mongoose.startSession();
  } catch (error) {
    // If sessions / transactions aren't supported (e.g. standalone Mongo)
    return operation(null);
  }

  try {
    return await session.withTransaction(() => operation(session));
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("replica set") ||
        error.message.includes("Transaction numbers are only allowed"))
    ) {
      // Standalone mongod fallback
      return operation(null);
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

module.exports = withMongoTransaction;
