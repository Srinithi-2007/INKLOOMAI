const mongoose = require("mongoose");

let connectionPromise;

function getMongoUri() {
  let uri = process.env.MONGODB_URI;
  if (!uri) return null;
  uri = uri.trim();
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }
  return uri || null;
}

function connectToMongo() {
  const uri = getMongoUri();
  if (!uri) {
    return Promise.reject(new Error("MONGODB_URI is not configured."));
  }

  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (mongoose.connection.readyState === 0) {
    connectionPromise = undefined;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then(() => mongoose.connection)
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  return connectionPromise;
}

module.exports = { connectToMongo };
