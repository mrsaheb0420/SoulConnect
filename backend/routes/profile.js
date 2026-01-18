const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

/*
=====================================
GET USER PROFILE
GET /api/profile/:id
=====================================
*/
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    if (!user) return res.status(404).json("User not found");

    const posts = await Post.find({ user: req.params.id })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);

    const stats = {
      postsCount: await Post.countDocuments({ user: req.params.id }),
      followersCount: user.followers.length,
      followingCount: user.following.length
    };

    res.json({ user, posts, stats });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json("Failed to fetch profile");
  }
});

/*
=====================================
UPDATE USER PROFILE
PUT /api/profile/:id
=====================================
*/
router.put("/:id", async (req, res) => {
  try {
    const { bio, location, website, profilePicture, coverPhoto } = req.body;

    // Validate user exists and is updating their own profile
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found");

    // Update allowed fields
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (website !== undefined) updates.website = website;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (coverPhoto !== undefined) updates.coverPhoto = coverPhoto;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json("Profile update failed");
  }
});

/*
=====================================
FOLLOW/UNFOLLOW USER
PUT /api/profile/:id/follow
=====================================
*/
router.put("/:id/follow", async (req, res) => {
  try {
    const { userId } = req.body; // Current user ID
    const targetUserId = req.params.id;

    if (userId === targetUserId) {
      return res.status(400).json("Cannot follow yourself");
    }

    const currentUser = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json("User not found");
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(userId);

      // Create notification
      await Notification.create({
        recipient: targetUserId,
        sender: userId,
        type: 'follow',
        message: 'started following you'
      });
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json("Follow operation failed");
  }
});

/*
=====================================
GET USER FOLLOWERS
GET /api/profile/:id/followers
=====================================
*/
router.get("/:id/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username profilePicture bio isVerified');

    if (!user) return res.status(404).json("User not found");

    res.json(user.followers);
  } catch (err) {
    res.status(500).json("Failed to fetch followers");
  }
});

/*
=====================================
GET USER FOLLOWING
GET /api/profile/:id/following
=====================================
*/
router.get("/:id/following", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username profilePicture bio isVerified');

    if (!user) return res.status(404).json("User not found");

    res.json(user.following);
  } catch (err) {
    res.status(500).json("Failed to fetch following");
  }
});

/*
=====================================
SEARCH USERS
GET /api/profile/search/:query
=====================================
*/
router.get("/search/:query", async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: req.params.query, $options: "i" } },
        { email: { $regex: req.params.query, $options: "i" } }
      ]
    })
    .select("username profilePicture bio isVerified followers following")
    .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json("User search failed");
  }
});

module.exports = router;
