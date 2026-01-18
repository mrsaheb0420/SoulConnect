const router = require("express").Router();
const Notification = require("../models/Notification");

/*
=====================================
GET USER NOTIFICATIONS
GET /api/notifications/:userId
=====================================
*/
router.get("/:userId", async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    let query = { recipient: req.params.userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'username profilePicture')
      .populate('post', 'text media')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalNotifications / limit),
        totalNotifications,
        unreadCount: await Notification.countDocuments({
          recipient: req.params.userId,
          isRead: false
        })
      }
    });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    res.status(500).json("Failed to fetch notifications");
  }
});

/*
=====================================
MARK NOTIFICATION AS READ
PUT /api/notifications/:id/read
=====================================
*/
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) return res.status(404).json("Notification not found");

    res.json(notification);
  } catch (err) {
    res.status(500).json("Failed to mark notification as read");
  }
});

/*
=====================================
MARK ALL NOTIFICATIONS AS READ
PUT /api/notifications/:userId/read-all
=====================================
*/
router.put("/:userId/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.params.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json("All notifications marked as read");
  } catch (err) {
    res.status(500).json("Failed to mark notifications as read");
  }
});

/*
=====================================
DELETE NOTIFICATION
DELETE /api/notifications/:id
=====================================
*/
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) return res.status(404).json("Notification not found");

    res.json("Notification deleted");
  } catch (err) {
    res.status(500).json("Failed to delete notification");
  }
});

module.exports = router;