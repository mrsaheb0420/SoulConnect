const router = require("express").Router();
const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");

/*
=====================================
SEND MESSAGE
POST /api/chat/send
=====================================
*/
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, text, media, messageType, replyTo } = req.body;

    // Validate users exist
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json("User not found");
    }

    // Create conversation ID (sorted user IDs for consistency)
    const conversationId = [senderId, receiverId].sort().join('_');

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      conversationId,
      text,
      media,
      messageType: messageType || 'text',
      replyTo
    });

    const savedMessage = await message.save();
    await savedMessage.populate('sender', 'username profilePicture');
    await savedMessage.populate('receiver', 'username profilePicture');

    res.json(savedMessage);
  } catch (err) {
    console.error('Message send error:', err);
    res.status(500).json("Message send failed");
  }
});

/*
=====================================
GET CONVERSATION MESSAGES
GET /api/chat/conversation/:userId/:otherUserId
=====================================
*/
router.get("/conversation/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const conversationId = [userId, otherUserId].sort().join('_');

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    const totalMessages = await Message.countDocuments({ conversationId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages
      }
    });
  } catch (err) {
    console.error('Conversation fetch error:', err);
    res.status(500).json("Failed to fetch conversation");
  }
});

/*
=====================================
GET USER CONVERSATIONS
GET /api/chat/conversations/:userId
=====================================
*/
router.get("/conversations/:userId", async (req, res) => {
  try {
    // Get all conversations for the user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: new mongoose.Types.ObjectId(req.params.userId) },
                { receiver: new mongoose.Types.ObjectId(req.params.userId) }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$receiver", new mongoose.Types.ObjectId(req.params.userId)] },
                  { $eq: ["$isRead", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.lastMessage.sender.toString() === req.params.userId
          ? conv.lastMessage.receiver
          : conv.lastMessage.sender;

        const otherUser = await User.findById(otherUserId)
          .select('username profilePicture isVerified');

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: {
            ...conv.lastMessage,
            sender: await User.findById(conv.lastMessage.sender).select('username profilePicture'),
            receiver: await User.findById(conv.lastMessage.receiver).select('username profilePicture')
          },
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json(populatedConversations);
  } catch (err) {
    console.error('Conversations fetch error:', err);
    res.status(500).json("Failed to fetch conversations");
  }
});

/*
=====================================
MARK MESSAGES AS READ
PUT /api/chat/conversation/:conversationId/read
=====================================
*/
router.put("/conversation/:conversationId/read", async (req, res) => {
  try {
    const { userId } = req.body;

    await Message.updateMany(
      { conversationId: req.params.conversationId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json("Messages marked as read");
  } catch (err) {
    res.status(500).json("Failed to mark messages as read");
  }
});

/*
=====================================
DELETE MESSAGE
DELETE /api/chat/message/:messageId
=====================================
*/
router.delete("/message/:messageId", async (req, res) => {
  try {
    const { userId } = req.body;

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json("Message not found");

    if (message.sender.toString() !== userId) {
      return res.status(403).json("Not authorized to delete this message");
    }

    await Message.findByIdAndDelete(req.params.messageId);
    res.json("Message deleted successfully");
  } catch (err) {
    res.status(500).json("Delete message failed");
  }
});

module.exports = router;
