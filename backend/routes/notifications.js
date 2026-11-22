const express = require("express");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");
const { authMiddleware } = require("./auth");

const router = express.Router();

// GET /api/notifications/provider-status - inspect event delivery provider status
router.get("/provider-status", authMiddleware, (req, res) => {
  return res.json(notificationService.getProviderStatus());
});

// GET /api/notifications/stream - Server-Sent Events stream
router.get("/stream", authMiddleware, async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (res.flushHeaders) {
    res.flushHeaders();
  }

  const userId = req.user.userId;
  notificationService.addClient(userId, res);

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected", userId })}\n\n`);

  // Handle reconnection with Last-Event-ID if provided
  const lastEventId = req.headers["last-event-id"];
  if (lastEventId && /^[a-f\d]{24}$/i.test(lastEventId)) {
    try {
      const missed = await Notification.find({
        recipientId: userId,
        _id: { $gt: lastEventId },
      }).sort({ createdAt: 1 });

      for (const notif of missed) {
        res.write(`id: ${notif._id}\nevent: notification\ndata: ${JSON.stringify(notif.toPublicJSON())}\n\n`);
      }
    } catch (missedErr) {
      console.error("Failed to query missed notifications:", missedErr.message);
    }
  }

  req.on("close", () => {
    notificationService.removeClient(userId, res);
  });
});

// GET /api/notifications - get notification history for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { unreadOnly, limit = 50 } = req.query;
    const filter = { recipientId: req.user.userId };

    if (unreadOnly === "true") {
      filter.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(100, Math.max(1, parseInt(limit, 10) || 50))),
      Notification.countDocuments({ recipientId: req.user.userId, read: false }),
    ]);

    return res.json({
      notifications: notifications.map((n) => n.toPublicJSON()),
      unreadCount,
    });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/:id/read - mark single notification as read
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    return res.json({
      success: true,
      notification: notification.toPublicJSON(),
    });
  } catch (err) {
    console.error("Failed to update notification:", err);
    return res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// PUT /api/notifications/read-all - mark all unread notifications as read
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user.userId, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
    return res.status(500).json({ error: "Failed to mark all as read" });
  }
});

module.exports = router;
