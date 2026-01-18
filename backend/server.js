const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const fileUpload = require("express-fileupload");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  abortOnLimit: true,
}));
app.use('/uploads', express.static('uploads'));

// Make multer available to routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// REST ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/story", require("./routes/story"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/uploads", require("./routes/uploads"));

// Sample data seeder (run once to populate the database)
app.post("/api/seed", async (req, res) => {
  try {
    const Post = require("./models/Post");
    const User = require("./models/User");
    const Story = require("./models/Story");
    const bcrypt = require("bcryptjs");

    // Sample users
    const sampleUsers = [
      { username: "alice_wonder", email: "alice@example.com", password: await bcrypt.hash("password123", 10) },
      { username: "bob_builder", email: "bob@example.com", password: await bcrypt.hash("password123", 10) },
      { username: "charlie_brown", email: "charlie@example.com", password: await bcrypt.hash("password123", 10) },
      { username: "diana_prince", email: "diana@example.com", password: await bcrypt.hash("password123", 10) },
      { username: "eve_online", email: "eve@example.com", password: await bcrypt.hash("password123", 10) },
    ];

    await User.insertMany(sampleUsers);

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
      },
      {
        user: "alice_wonder",
        text: "Reading a fascinating book about space exploration. The universe is so vast and mysterious! What's your favorite book this year? 📚🌌 #BookLovers #Space",
        likes: 22,
        comments: [
          { user: "eve_online", text: "I just finished 'The Martian' - incredible read!" }
        ]
      },
      {
        user: "bob_builder",
        text: "Weekend project complete! Built a new bookshelf for my growing collection of books. Nothing beats the satisfaction of creating something with your own hands. 🛠️📚 #DIY #Woodworking",
        likes: 19,
        comments: [
          { user: "charlie_brown", text: "That looks amazing! You're so talented!" }
        ]
      },
      {
        user: "diana_prince",
        text: "Beautiful sunset walk by the beach. Sometimes you just need to pause and appreciate the simple beauty around us. 🌅🏖️ #Sunset #Peaceful",
        likes: 33,
        comments: [
          { user: "alice_wonder", text: "Absolutely stunning! Nature's artwork ✨" },
          { user: "eve_online", text: "Perfect way to end the day!" }
        ]
      }
    ];

    await Post.insertMany(samplePosts);

    // Sample stories
    const sampleStories = [
      { user: "alice_wonder", text: "Good morning! Starting the day with positive energy ☀️" },
      { user: "bob_builder", text: "Coffee time! ☕ Ready to tackle the day!" },
      { user: "charlie_brown", text: "Weekend vibes 🎉" },
      { user: "diana_prince", text: "Beautiful day for a walk 🌳" },
      { user: "eve_online", text: "Music makes everything better 🎵" },
    ];

    await Story.insertMany(sampleStories);

    res.json({ message: "Sample data seeded successfully!" });
  } catch (error) {
    console.error("Seeding error:", error);
    res.status(500).json({ error: "Failed to seed data" });
  }
});

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const onlineUsers = new Map();

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  socket.on("sendMessage", (message) => {
    // Send to receiver if online
    const receiverSocketId = onlineUsers.get(message.receiver._id || message.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", message);
    }

    // Also send back to sender for confirmation
    socket.emit("messageSent", message);
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// START SERVER
server.listen(5000, () =>
  console.log("Server + Socket running on port 5000")
);
