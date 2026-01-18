const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Models
const User = require("./models/User");
const Post = require("./models/Post");
const Story = require("./models/Story");

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/soulconnect");
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Story.deleteMany({});
    console.log("Cleared existing data");

    // Sample users
    const sampleUsers = [
      { username: "alice_wonder", email: "alice@example.com", password: await bcrypt.hash("password123", 10) },
      { username: "bob_builder", email: "bob@example.com", password: await bcrypt.hash("password123", 10) },
      { username: "charlie_brown", email: "charlie@example.com", password: await bcrypt.hash("password123", 10) },
      { username: "diana_prince", email: "diana@example.com", password: await bcrypt.hash("password123", 10) },
      { username: "eve_online", email: "eve@example.com", password: await bcrypt.hash("password123", 10) },
    ];

    await User.insertMany(sampleUsers);
    console.log("Users seeded");

    // Sample posts
    const samplePosts = [
      {
        user: "alice_wonder",
        text: "Just finished an amazing hike in the mountains! The view was absolutely breathtaking. Nature never ceases to amaze me! 🏔️✨ #Adventure #NatureLover",
        likes: 24,
        comments: [
          { user: "bob_builder", text: "Looks incredible! Where was this?" },
          { user: "charlie_brown", text: "Wish I could join you next time!" }
        ]
      },
      {
        user: "bob_builder",
        text: "Working on some exciting new projects at the office. Can't wait to share the results with everyone! The team is doing amazing work. 🚀💪 #WorkLife #Innovation",
        likes: 18,
        comments: [
          { user: "alice_wonder", text: "Sounds exciting! Keep us posted!" }
        ]
      },
      {
        user: "charlie_brown",
        text: "Spent the weekend trying out new recipes in the kitchen. This chocolate cake turned out perfect! 🍫🎂 Who wants the recipe? #Baking #Foodie",
        likes: 31,
        comments: [
          { user: "diana_prince", text: "OMG that looks delicious! Please share!" },
          { user: "eve_online", text: "I want that recipe too! 📝" }
        ]
      },
      {
        user: "diana_prince",
        text: "Morning coffee and some quiet time to reflect. Starting the day with gratitude and positive vibes. What's everyone thankful for today? ☕❤️ #MorningRoutine #Gratitude",
        likes: 15,
        comments: [
          { user: "alice_wonder", text: "Great way to start the day! I'm thankful for good friends like you 💕" }
        ]
      },
      {
        user: "eve_online",
        text: "Just got back from an incredible concert! The energy was electric and the music was phenomenal. Live music feeds the soul! 🎵🎶 #MusicLover #Concert",
        likes: 27,
        comments: [
          { user: "bob_builder", text: "Which band? I love live music too!" },
          { user: "charlie_brown", text: "Wish I was there! Next time?" }
        ]
      }
    ];

    await Post.insertMany(samplePosts);
    console.log("Posts seeded");

    // Sample stories
    const sampleStories = [
      { user: "alice_wonder", text: "Good morning! Starting the day with positive energy ☀️" },
      { user: "bob_builder", text: "Coffee time! ☕ Ready to tackle the day!" },
      { user: "charlie_brown", text: "Weekend vibes 🎉" },
      { user: "diana_prince", text: "Beautiful day for a walk 🌳" },
      { user: "eve_online", text: "Music makes everything better 🎵" },
    ];

    await Story.insertMany(sampleStories);
    console.log("Stories seeded");

    console.log("✅ Sample data seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

seedData();