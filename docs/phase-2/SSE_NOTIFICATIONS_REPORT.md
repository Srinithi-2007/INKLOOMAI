# INKLOOM AI — REAL-TIME SSE NOTIFICATIONS REPORT

**Feature:** Real-Time Server-Sent Events (SSE) Notifications (Phase 2 Feature 3)  
**Author:** Senior Backend Architect & Distributed Systems Engineer  
**Status:** COMPLETE & VERIFIED (Zero Regressions)

---

## 1. Overview & Architectural Motivation

Real-time feedback is vital for collaborative content governance. When a brand creates a campaign assignment, when a freelancer submits content, when revisions are requested, or when content is approved or rejected, parties need instant, non-polling notification.

We selected Server-Sent Events (SSE) over WebSockets because:
1. **Unidirectional Simplicity:** Server-to-client push is the primary pattern; client-to-server operations flow via standard authenticated REST endpoints.
2. **Standard HTTP Compatibility:** SSE operates over standard HTTP/1.1 and HTTP/2 ports (4000/3000), traversing enterprise corporate firewalls, reverse proxies, and CORS configurations effortlessly.
3. **Native Browser Reconnection:** The browser `EventSource` API natively supports automatic reconnection, exponential backoff, and event IDs.

---

## 2. Notification Model (`backend/models/Notification.js`)

```javascript
const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "assignment_created",
        "assignment_accepted",
        "submission_received",
        "revision_requested",
        "review_approved",
        "review_rejected",
        "system",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);
```

---

## 3. Notification Service (`backend/services/notificationService.js`)

- **In-Memory Connection Pool:** Maintains a `Map<userId, Set<Response>>` allowing users with multiple open browser tabs to receive events simultaneously.
- **SSE Keep-Alive Heartbeat:** An unref'd timer writes `: ping\n\n` comments every 20 seconds, preventing proxy timeouts (e.g. Cloudflare, AWS ALB, NGINX) from prematurely terminating idle streams.
- **Resource Cleanup:** Subscribes to `req.on("close")` to prune terminated connections and purge inactive sets from memory.
- **Dispatch Flow:**
  1. Creates and saves `Notification` record in MongoDB.
  2. Queries active SSE connections for `recipientId`.
  3. Writes `event: notification\ndata: <JSON>\n\n` to all active streams for that user.

---

## 4. Endpoints & Workflow Triggers

### Endpoints (`backend/routes/notifications.js`)
- `GET /api/notifications/stream`: SSE stream endpoint with headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`. Supports `Last-Event-ID` to replay missed events upon reconnection.
- `GET /api/notifications`: Retrieves user notifications sorted descending by timestamp with `unreadCount`.
- `PUT /api/notifications/:id/read`: Marks individual notification as read.
- `PUT /api/notifications/read-all`: Marks all notifications as read in bulk.

### Trigger Points
1. **Assignment Created (`routes/assignments.js`):** Notifies Freelancer upon campaign assignment.
2. **Assignment Accepted (`routes/assignments.js`):** Notifies Brand Admin when Freelancer accepts work.
3. **Draft Submitted (`routes/submissions.js`):** Notifies Brand Admin that content is ready for review.
4. **Revision Requested (`routes/submissions.js`):** Notifies Freelancer with feedback and suggestions.
5. **Content Resubmitted (`routes/submissions.js`):** Notifies Brand Admin of updated draft.
6. **Brand Review Decision (`routes/reviews.js`):** Notifies Freelancer of approval or rejection.

---

## 5. Frontend Notification Bell Component

Built `frontend/components/ui/NotificationBell.tsx`:
- Integrated into `Header.tsx` and `BrandLayout.tsx`.
- Connects automatically to `/api/notifications/stream` with credentials.
- Animated unread counter badge updates in real-time.
- Dropdown menu allows viewing notifications, marking as read, marking all as read, and direct deep-linking to relevant workspace views.

---

## 6. Automated Integration Tests (`backend/test/sseNotifications.test.js`)

All 7 automated integration tests pass:
- `GET /api/notifications` rejects unauthenticated request with 401.
- Assignment workflow triggers real-time notification to Freelancer.
- `GET /api/notifications` returns notification list and unread count.
- `PUT /api/notifications/:id/read` marks notification as read.
- `PUT /api/notifications/:id/read` rejects marking another user's notification (404/403).
- `PUT /api/notifications/read-all` marks all unread notifications as read.
- `notificationService` handles simulated SSE stream broadcast and client lifecycle safely.
