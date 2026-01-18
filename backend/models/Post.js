const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2200
    },
    media: [{
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      publicId: String // For cloud storage like Cloudinary
    }],
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: {
        type: String,
        required: true,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      likes: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }]
    }],
    tags: [String],
    location: String,
    isRepost: {
      type: Boolean,
      default: false
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    }
  },
  { timestamps: true }
);

// Index for better query performance
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ 'likes.user': 1 });
PostSchema.index({ tags: 1 });

module.exports = mongoose.model("Post", PostSchema);
