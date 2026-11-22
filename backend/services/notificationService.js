const Pusher = require("pusher");
const Notification = require("../models/Notification");

// Map of userId string -> Set of Express Response objects (Local SSE connections)
const clientConnections = new Map();

// Periodic heartbeat interval to keep local SSE streams alive (every 20s)
let heartbeatTimer = null;

function initHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const [userId, resSet] of clientConnections.entries()) {
      for (const res of resSet) {
        try {
          if (!res.writableEnded) {
            res.write(": ping\n\n");
          }
        } catch (err) {
          resSet.delete(res);
        }
      }
      if (resSet.size === 0) {
        clientConnections.delete(userId);
      }
    }
  }, 20000);
  heartbeatTimer.unref?.();
}

function addClient(userId, res) {
  if (!userId || !res) return;
  const userKey = userId.toString();
  if (!clientConnections.has(userKey)) {
    clientConnections.set(userKey, new Set());
  }
  clientConnections.get(userKey).add(res);
  initHeartbeat();
}

function removeClient(userId, res) {
  if (!userId || !res) return;
  const userKey = userId.toString();
  const resSet = clientConnections.get(userKey);
  if (resSet) {
    resSet.delete(res);
    if (resSet.size === 0) {
      clientConnections.delete(userKey);
    }
  }
}

function getConnectedClientCount(userId) {
  if (!userId) return 0;
  return clientConnections.get(userId.toString())?.size || 0;
}

let pusherClient = null;

function isPusherConfigured() {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET
  );
}

function getPusherClient() {
  if (pusherClient) return pusherClient;
  if (!isPusherConfigured()) return null;

  try {
    pusherClient = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || "mt1",
      useTLS: true,
    });
    return pusherClient;
  } catch (err) {
    console.error("Failed to initialize Pusher client:", err.message);
    return null;
  }
}

function getNotificationProvider() {
  const explicit = (process.env.NOTIFICATION_PROVIDER || "").toLowerCase().trim();
  if (explicit === "pusher") return "pusher";
  if (explicit === "local-sse") return "local-sse";
  if (isPusherConfigured()) return "pusher";
  return "local-sse";
}

function getProviderStatus() {
  const provider = getNotificationProvider();
  const configured = isPusherConfigured();
  return {
    provider,
    isExternalConfigured: configured,
    activeProviderName: configured
      ? "Pusher Channels (Vercel Serverless Compatible)"
      : "Local In-Memory SSE Pool (Single Process)",
    missingCredentials: configured
      ? []
      : ["PUSHER_APP_ID", "PUSHER_KEY", "PUSHER_SECRET", "PUSHER_CLUSTER"],
    connectedLocalClients: Array.from(clientConnections.values()).reduce(
      (sum, set) => sum + set.size,
      0
    ),
  };
}

function sendToUser(userId, event, payload) {
  const userKey = userId.toString();
  const resSet = clientConnections.get(userKey);
  let sentCount = 0;

  // 1. Deliver to local SSE connections (dev / active streams)
  if (resSet && resSet.size > 0) {
    const dataString = typeof payload === "string" ? payload : JSON.stringify(payload);
    const message = `event: ${event}\ndata: ${dataString}\n\n`;
    for (const res of resSet) {
      try {
        if (!res.writableEnded) {
          res.write(message);
          sentCount++;
        }
      } catch (err) {
        resSet.delete(res);
      }
    }
    if (resSet.size === 0) {
      clientConnections.delete(userKey);
    }
  }

  // 2. Deliver via persistent external event broker (Pusher Channels) when configured
  const pusher = getPusherClient();
  if (pusher) {
    const channelName = `user-${userKey}`;
    pusher.trigger(channelName, event, payload).catch((err) => {
      console.error(`Pusher dispatch failed for user ${userKey}:`, err.message);
    });
  }

  return sentCount;
}

async function dispatchToExternal(userId, event, payload) {
  const pusher = getPusherClient();
  if (!pusher) {
    return { dispatched: false, reason: "Pusher credentials not configured" };
  }
  const userKey = userId.toString();
  const channelName = `user-${userKey}`;
  await pusher.trigger(channelName, event, payload);
  return { dispatched: true, channel: channelName };
}

async function createAndDispatchNotification({
  recipientId,
  senderId,
  type,
  title,
  message,
  link = "",
  metadata = {},
}) {
  try {
    const notification = new Notification({
      recipientId,
      senderId,
      type,
      title,
      message,
      link,
      metadata,
    });
    await notification.save();

    const publicJSON = notification.toPublicJSON();
    sendToUser(recipientId, "notification", publicJSON);

    return publicJSON;
  } catch (err) {
    console.error("Error creating or dispatching notification:", err.message);
    return null;
  }
}

module.exports = {
  addClient,
  removeClient,
  getConnectedClientCount,
  sendToUser,
  createAndDispatchNotification,
  isPusherConfigured,
  getNotificationProvider,
  getProviderStatus,
  dispatchToExternal,
  getPusherClient,
};
