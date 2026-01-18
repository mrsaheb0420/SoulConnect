const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

/*
=====================================
CREATE A POST
POST /api/posts
=====================================
*/
router.post("/", async (req, res) => {
  try {
    const { userId, text, media, tags, location, visibility } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json("User not found");

    const post = new Post({
      user: userId,
      text,
      media: media || [],
      tags: tags || [],
      location,
      visibility: visibility || 'public'
    });

    const savedPost = await post.save();
    await savedPost.populate('user', 'username profilePicture');

    res.json(savedPost);
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json("Post creation failed");
  }
});

/*
=====================================
GET ALL POSTS (FEED)
GET /api/posts
=====================================
*/
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const skip = (page - 1) * limit;

    let query = { visibility: 'public' };

    // If userId provided, include their posts and posts from followed users
    if (userId) {
      const user = await User.findById(userId).select('following');
      if (user) {
        query = {
          $or: [
            { visibility: 'public' },
            { user: { $in: user.following }, visibility: { $in: ['public', 'friends'] } },
            { user: userId }
          ]
        };
      }
    }

    const posts = await Post.find(query)
      .populate('user', 'username profilePicture isVerified')
      .populate('likes.user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNext: parseInt(page) * limit < totalPosts
      }
    });
  } catch (err) {
    console.error('Feed fetch error:', err);
    res.status(500).json("Failed to fetch posts");
  }
});

/*
=====================================
GET POST BY ID
GET /api/posts/:id
=====================================
*/
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username profilePicture bio isVerified followers following')
      .populate('likes.user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .populate('comments.likes', 'username profilePicture');

    if (!post) return res.status(404).json("Post not found");

    res.json(post);
  } catch (err) {
    res.status(500).json("Failed to fetch post");
  }
});

/*
=====================================
LIKE/UNLIKE A POST
PUT /api/posts/like/:id
=====================================
*/
router.put("/like/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json("Post not found");

    const existingLike = post.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(like => like.user.toString() !== userId);
    } else {
      // Like
      post.likes.push({ user: userId });

      // Create notification if not liking own post
      if (post.user.toString() !== userId) {
        await Notification.create({
          recipient: post.user,
          sender: userId,
          type: 'like',
          message: 'liked your post',
          post: post._id
        });
      }
    }

    await post.save();
    await post.populate('user', 'username profilePicture');
    await post.populate('likes.user', 'username profilePicture');

    res.json(post);
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json("Like failed");
  }
});

/*
=====================================
ADD COMMENT TO POST
POST /api/posts/comment/:id
=====================================
*/
router.post("/comment/:id", async (req, res) => {
  try {
    const { userId, text, replyTo } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json("Post not found");

    const newComment = {
      user: userId,
      text,
      replyTo: replyTo || null
    };

    post.comments.push(newComment);
    await post.save();

    // Create notification if not commenting on own post
    if (post.user.toString() !== userId) {
      await Notification.create({
        recipient: post.user,
        sender: userId,
        type: 'comment',
        message: 'commented on your post',
        post: post._id
      });
    }

    await post.populate('user', 'username profilePicture');
    await post.populate('comments.user', 'username profilePicture');

    res.json(post);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json("Comment failed");
  }
});

/*
=====================================
LIKE/UNLIKE A COMMENT
PUT /api/posts/comment/:postId/:commentId/like
=====================================
*/
router.put("/comment/:postId/:commentId/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json("Post not found");

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json("Comment not found");

    const existingLike = comment.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      comment.likes = comment.likes.filter(like => like.user.toString() !== userId);
    } else {
      comment.likes.push({ user: userId });
    }

    await post.save();
    await post.populate('comments.user', 'username profilePicture');
    await post.populate('comments.likes', 'username profilePicture');

    res.json(post);
  } catch (err) {
    res.status(500).json("Comment like failed");
  }
});

/*
=====================================
DELETE POST
DELETE /api/posts/:id
=====================================
*/
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json("Post not found");

    if (post.user.toString() !== userId) {
      return res.status(403).json("Not authorized to delete this post");
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json("Post deleted successfully");
  } catch (err) {
    res.status(500).json("Delete failed");
  }
});

/*
=====================================
SEARCH POSTS
GET /api/posts/search/:text
=====================================
*/
router.get("/search/:text", async (req, res) => {
  try {
    const posts = await Post.find({
      $and: [
        { visibility: 'public' },
        {
          $or: [
            { text: { $regex: req.params.text, $options: "i" } },
            { tags: { $in: [new RegExp(req.params.text, 'i')] } }
          ]
        }
      ]
    })
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json(posts);
  } catch (err) {
    res.status(500).json("Search failed");
  }
});

/*
=====================================
GET USER'S POSTS
GET /api/posts/user/:userId
=====================================
*/
router.get("/user/:userId", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'username profilePicture')
      .populate('likes.user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments({ user: req.params.userId });

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts
      }
    });
  } catch (err) {
    res.status(500).json("Failed to fetch user posts");
  }
});

module.exports = router;
