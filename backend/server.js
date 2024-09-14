const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const User = require("./models/User"); // Make sure you have a User model
const JobType = require("./models/JobType");
const ProductionData = require("./models/ProductionData");
const cors = require("cors");
const jwt = require("jsonwebtoken"); // Add this line
const authRoutes = require("./routes/auth");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(cors());
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

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "clockInOut") {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "refreshUsers" }));
        }
      });
    }
  });
});

const sendUserUpdates = () => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "refreshUsers" }));
    }
  });
};

function cleanup() {
  for (const [userId, ws] of activeConnections) {
    console.log(`Closing WebSocket connection for user ${userId}`);
    ws.close();
  }
}

process.on("SIGINT", () => {
  console.log("Closing all WebSocket connections...");
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Closing all WebSocket connections...");
  cleanup();
  process.exit(0);
});

const userRoutes = require("./routes/users");
const jobTypeRoutes = require("./routes/jobTypes");
const timeclockRoutes = require("./routes/timeclock"); // Add this line
const productionRoutes = require("./routes/production");
const statsRoutes = require("./routes/stats");
const reportsRoutes = require("./routes/reports");
app.use("/api/stats", statsRoutes);
app.use("/api/reports", reportsRoutes);

// const auth = require("./middleware/auth");  // Comment this out

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not defined in the environment variables");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add this before your routes
app.use((req, res, next) => {
  console.log("Incoming request:", {
    method: req.method,
    path: req.path,
    body: req.body || {},
    query: req.query,
    params: req.params,
  });
  next();
});

// Your routes go here
app.use("/api/users", userRoutes);
app.use("/api/jobTypes", jobTypeRoutes);
app.use("/api/timeclock", timeclockRoutes); // Add this line
app.use("/api/production", productionRoutes);
app.use("/api/stats", statsRoutes);

// Remove or comment out these employee routes as they're now handled in userRoutes
// app.post("/employees", async (req, res) => {
//   const employee = new Employee(req.body);
//   await employee.save();
//   res.send(employee);
// });

// app.get("/employees", async (req, res) => {
//   const employees = await Employee.find();
//   res.send(employees);
// });

// JobType routes (if not already in jobTypeRoutes)
app.use("/auth", authRoutes);

app.post("/jobTypes", async (req, res) => {
  const jobType = new JobType(req.body);
  await jobType.save();
  res.send(jobType);
});

app.get("/jobTypes", async (req, res) => {
  const jobTypes = await JobType.find();
  res.send(jobTypes);
});

// ProductionData routes
app.post("/productionData", async (req, res) => {
  const productionData = new ProductionData(req.body);
  await productionData.save();

  const user = await User.findById(productionData.userId);
  const jobType = await JobType.findById(productionData.jobTypeId);
  const efficiency =
    (productionData.piecesPressed * jobType.multiplier) /
    productionData.clockedInTime;

  // io.emit("updateEfficiency", {
  //   userId: productionData.userId,
  //   efficiency,
  // });

  const itemsPressed = await calculateItemsPressed(productionData.userId);
  wss.clients.forEach((client) => {
    if (client.userId === productionData.userId) {
      client.send(
        JSON.stringify({ type: "itemsPressed", count: itemsPressed })
      );
    }
  });

  res.send(productionData);
});

// Function to calculate overall production statistics
async function calculateOverallStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await ProductionData.aggregate([
    {
      $match: {
        createdAt: { $gte: today },
      },
    },
    {
      $group: {
        _id: null,
        totalPieces: { $sum: "$piecesPressed" },
        totalTime: { $sum: "$clockedInTime" },
        employeeCount: { $addToSet: "$userId" },
      },
    },
  ]);

  if (stats.length > 0) {
    const { totalPieces, totalTime, employeeCount } = stats[0];
    const overallEfficiency = (totalPieces / (totalTime / 3600)).toFixed(2);
    return {
      totalPieces,
      overallEfficiency,
      activeEmployees: employeeCount.length,
    };
  }

  return { totalPieces: 0, overallEfficiency: 0, activeEmployees: 0 };
}

// Function to calculate detailed statistics
async function calculateDetailedStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overallStats = await ProductionData.aggregate([
    {
      $match: {
        createdAt: { $gte: today },
      },
    },
    {
      $group: {
        _id: null,
        totalPieces: { $sum: "$piecesPressed" },
        totalTime: { $sum: "$clockedInTime" },
        employeeCount: { $addToSet: "$userId" },
      },
    },
  ]);

  const jobTypeStats = await ProductionData.aggregate([
    {
      $match: {
        createdAt: { $gte: today },
      },
    },
    {
      $group: {
        _id: "$jobTypeId",
        totalPieces: { $sum: "$piecesPressed" },
        totalTime: { $sum: "$clockedInTime" },
        employeeCount: { $addToSet: "$userId" },
      },
    },
  ]);

  const jobTypes = await JobType.find();
  const jobTypeMap = jobTypes.reduce((acc, jobType) => {
    acc[jobType._id] = jobType.name;
    return acc;
  }, {});

  const detailedJobTypeStats = jobTypeStats.map((stat) => ({
    jobTypeName: jobTypeMap[stat._id],
    totalPieces: stat.totalPieces,
    efficiency: (stat.totalPieces / (stat.totalTime / 3600)).toFixed(2),
    activeEmployees: stat.employeeCount.length,
  }));

  return {
    overall:
      overallStats.length > 0
        ? {
            totalPieces: overallStats[0].totalPieces,
            overallEfficiency: (
              overallStats[0].totalPieces /
              (overallStats[0].totalTime / 3600)
            ).toFixed(2),
            activeEmployees: overallStats[0].employeeCount.length,
          }
        : { totalPieces: 0, overallEfficiency: 0, activeEmployees: 0 },
    byJobType: detailedJobTypeStats,
  };
}

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

const PORT = process.env.PORT || 5001;

function startServer(port) {
  server
    .listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log("Available routes:");
      app._router.stack.forEach((r) => {
        if (r.route && r.route.path) {
          console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
        } else if (r.name === "router") {
          r.handle.stack.forEach((nestedRoute) => {
            if (nestedRoute.route) {
              console.log(
                `${Object.keys(nestedRoute.route.methods)} /auth${
                  nestedRoute.route.path
                }`
              );
            }
          });
        }
      });
    })
    .on("error", (e) => {
      if (e.code === "EADDRINUSE") {
        console.log(`Port ${port} is busy, trying ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error(e);
      }
    });
}
startServer(5000);

// Add this near the end of your server.js file, after your routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
