const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
require("dotenv").config();

// Add this near the top of your file, after the require statements
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(cors());
app.options('*', cors());

// Set up WebSocket
app.set("wss", wss);
const activeConnections = new Map();

wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "subscribe" && data.userId) {
        const userId = data.userId;
        if (activeConnections.has(userId)) {
          const oldWs = activeConnections.get(userId);
          if (oldWs !== ws && oldWs.readyState === WebSocket.OPEN) {
            oldWs.close();
            console.log(`Closed old WebSocket connection for user ${userId}`);
          }
        }
        activeConnections.set(userId, ws);
        ws.userId = userId;
        console.log(`User ${userId} subscribed to WebSocket`);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    if (ws.userId) {
      console.log(`WebSocket disconnected for user ${ws.userId}`);
      if (activeConnections.get(ws.userId) === ws) {
        activeConnections.delete(ws.userId);
      }
    }
  });
});

// Add necessary middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your routes go here
const userRoutes = require("./routes/users");
const jobTypeRoutes = require("./routes/jobTypes");
const timeclockRoutes = require("./routes/timeclock"); 
const productionRoutes = require("./routes/production");
const statsRoutes = require("./routes/stats");
const reportsRoutes = require("./routes/reports");
app.use("/api/stats", statsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobTypes", jobTypeRoutes);
app.use("/api/timeclock", timeclockRoutes);
app.use("/api/production", productionRoutes);
app.use("/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? {} : err,
  });
});

// Catch-all route for undefined routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Route not found" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend is working" });
});

const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', () => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

