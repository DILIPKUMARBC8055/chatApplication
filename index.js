import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import connectToMongo from "./config/mongoose.config.js"; // Import MongoDB connection setup
import UserModel from "./src/features/user/user.schema.js"; // Import User model/schema
import chatModel from "./src/features/chat/chat.schema.js"; // Import Chat model/schema

const app = express();
const server = http.createServer(app);

// Set up CORS middleware
app.use(cors());

// Create Socket.IO server instance
const io = new Server(server, {
  cors: {
    origin: "*", // Allow requests from any origin
    methods: ["GET", "POST"], // Allow GET and POST methods
  },
});

// Handle new connections
io.on("connection", async (socket) => {
  // Get list of connected users from the database
  const connectedUsers = await UserModel.find();

  // Emit the list of connected users to the newly connected client
  socket.emit("joineduserList", connectedUsers);
  console.log("New client connected");

  // Handle new user joining
  socket.on("newUserJoined", async (userName) => {
    // Create a new user document in the database
    const user = new UserModel({
      name: userName,
      number: Math.round(Math.random() * 100), // Generate a random number for the user
    });
    await user.save(); // Save the user to the database

    // Store user details in the socket object for future reference
    socket.userId = user._id;
    socket.userName = userName;
    socket.number = user.number;

    // Get updated list of connected users from the database
    const updatedConnectedUsers = await UserModel.find();

    // Emit updated user list to all clients
    io.emit("joineduserList", updatedConnectedUsers);

    // Fetch previous chats from the database and emit them to the new user
    const chats = await chatModel.find().sort({ time: 1 });
    socket.emit("prevChats", chats);

    // Broadcast user joining notification to all clients except the new user
    socket.broadcast.emit(
      "userLeftNotification",
      `${socket.userName} joined the chat`
    );
  });

  // Handle new message received
  socket.on("new_message_received", async (data) => {
    // Save the new message to the database
    const newMsg = new chatModel({
      user: data.PERSON_NAME,
      text: data.msgText,
      time: new Date(),
    });
    await newMsg.save();

    // Find the user who sent the message and broadcast the message to all clients
    const user = await UserModel.findOne({ name: data.PERSON_NAME });
    if (user) {
      socket.broadcast.emit("broadcast_msg", {
        id: user.number,
        userName: data.PERSON_NAME,
        msg: data.msgText,
      });
    }
  });

  // Handle user typing
  socket.on("userTyping", (userName) => {
    // Broadcast typing notification to all clients except the sender
    socket.broadcast.emit("userTypingBroadcast", userName);
  });

  // Handle user typing completion
  socket.on("userTypingCompleted", (userName) => {
    // Broadcast typing completion notification to all clients except the sender
    socket.broadcast.emit("userTypingCompletedBroadcast", userName);
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    // Remove the disconnected user from the database
    await UserModel.deleteOne({ _id: socket.userId });

    // Get updated list of connected users from the database
    const updatedConnectedUsers = await UserModel.find();

    // Broadcast user leaving notification to all clients
    socket.broadcast.emit(
      "userLeftNotification",
      `${socket.userName} left the chat `
    );

    // Emit updated user list to all clients
    io.emit("usersListUpdated", updatedConnectedUsers);

    console.log("Client disconnected");
  });
});

// Start the server
server.listen(3000, () => {
  console.log("server is listening at port 3000");
  // Connect to MongoDB
  connectToMongo();
});
