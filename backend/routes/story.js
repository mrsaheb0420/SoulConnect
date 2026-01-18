const router = require("express").Router();
const Story = require("../models/Story");
const User = require("../models/User");

/*
=====================================
CREATE STORY
POST /api/story
=====================================
*/
router.post("/", async (req, res) => {
  try {
    const { userId, media, text, backgroundColor, textColor, fontStyle } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json("User not found");

    const story = new Story({
      user: userId,
      media,
      text,
      backgroundColor: backgroundColor || '#ffffff',
      textColor: textColor || '#000000',
      fontStyle: fontStyle || 'normal'
    });

    const savedStory = await story.save();
    await savedStory.populate('user', 'username profilePicture');

    res.json(savedStory);
  } catch (err) {
    console.error('Story creation error:', err);
    res.status(500).json("Story creation failed");
  }
});

/*
=====================================
GET STORIES FOR FEED
GET /api/story
=====================================
*/
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    // Get stories from users that the current user follows, plus their own stories
    let userIds = [];
    if (userId) {
      const user = await User.findById(userId).select('following');
      if (user) {
        userIds = [...user.following, userId];
      }
    }

    const stories = await Story.find({
      user: { $in: userIds }
    })
    .populate('user', 'username profilePicture isVerified')
    .populate('views.user', 'username profilePicture')
    .populate('likes.user', 'username profilePicture')
    .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    res.json(Object.values(groupedStories));
  } catch (err) {
    console.error('Stories fetch error:', err);
    res.status(500).json("Failed to fetch stories");
  }
});

/*
=====================================
UPDATE STORY
PUT /api/story/:id
=====================================
*/
router.put("/:id", async (req, res) => {
  try {
    const { userId, text, backgroundColor, textColor, fontStyle } = req.body;

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json("Story not found");

    if (story.user.toString() !== userId) {
      return res.status(403).json("Not authorized to update this story");
    }

    // Update allowed fields
    if (text !== undefined) story.text = text;
    if (backgroundColor !== undefined) story.backgroundColor = backgroundColor;
    if (textColor !== undefined) story.textColor = textColor;
    if (fontStyle !== undefined) story.fontStyle = fontStyle;

    await story.save();
    await story.populate('user', 'username profilePicture');

    res.json(story);
  } catch (err) {
    console.error('Story update error:', err);
    res.status(500).json("Story update failed");
  }
});

/*
=====================================
VIEW STORY
router.put("/:id/view", async (req, res) => {
  try {
    const { userId } = req.body;

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json("Story not found");

    // Check if user already viewed this story
    const existingView = story.views.find(view => view.user.toString() === userId);
    if (!existingView) {
      story.views.push({ user: userId });
      await story.save();
    }

    res.json(story);
  } catch (err) {
    res.status(500).json("View story failed");
  }
});

/*
=====================================
LIKE/UNLIKE STORY
PUT /api/story/:id/like
=====================================
*/
router.put("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json("Story not found");

    const existingLike = story.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      story.likes = story.likes.filter(like => like.user.toString() !== userId);
    } else {
      story.likes.push({ user: userId });
    }

    await story.save();
    await story.populate('likes.user', 'username profilePicture');

    res.json(story);
  } catch (err) {
    res.status(500).json("Like story failed");
  }
});

/*
=====================================
DELETE STORY
DELETE /api/story/:id
=====================================
*/
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json("Story not found");

    if (story.user.toString() !== userId) {
      return res.status(403).json("Not authorized to delete this story");
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json("Story deleted successfully");
  } catch (err) {
    res.status(500).json("Delete story failed");
  }
});

module.exports = router;
