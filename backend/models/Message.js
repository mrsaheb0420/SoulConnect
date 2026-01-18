const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video', 'audio']
    },
    url: String,
    publicId: String
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, { timestamps: true });

// Index for efficient chat queries
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ sender: 1, receiver: 1 });
MessageSchema.index({ receiver: 1, isRead: 1 });

module.exports = mongoose.model("Message", MessageSchema);
