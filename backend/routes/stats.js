const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const TimeclockEntry = require("../models/TimeclockEntry");
const ProductionEntry = require("../models/ProductionEntry");
const JobType = require("../models/JobType");

async function calculateOverallStats(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total pieces pressed
    const productionEntries = await ProductionEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          totalPieces: { $sum: "$piecesPressed" },
        },
      },
    ]);

    const totalPieces =
      productionEntries.length > 0 ? productionEntries[0].totalPieces : 0;

    // Get timeclock entries
    const timeclockEntries = await TimeclockEntry.find({
      userId,
      startTime: { $gte: today },
    });

    let totalTimeInHours = 0;
    const now = new Date();
    timeclockEntries.forEach((entry) => {
      const endTime = entry.endTime || now;
      totalTimeInHours += (endTime - entry.startTime) / (1000 * 60 * 60);
    });

    // Calculate current PPOH
    const currentPPOH =
      totalTimeInHours > 0 ? totalPieces / totalTimeInHours : 0;

    // Get the current job type for the user
    const latestTimeclockEntry = timeclockEntries[timeclockEntries.length - 1];
    const currentJobId = latestTimeclockEntry
      ? latestTimeclockEntry.jobTypeId
      : null;
    const currentJob = currentJobId
      ? await JobType.findById(currentJobId)
      : null;
    const goalPPOH = currentJob ? currentJob.expectedPPOH : 0;

    return {
      totalPieces,
      currentPPOH,
      goalPPOH,
      currentJobId,
    };
  } catch (error) {
    console.error("Error in calculateOverallStats:", error);
    throw error;
  }
}

router.get("/overall", async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(`Received request for user: ${userId}`);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const stats = await calculateOverallStats(userId);
    console.log(`Sending stats: ${JSON.stringify(stats)}`);
    res.json({
      ...stats,
      itemsPressed: stats.totalPieces,
    });
  } catch (error) {
    console.error("Error fetching overall stats:", error);
    res.status(500).json({
      message: "Error fetching overall stats",
      error: error.message,
    });
  }
});

router.get("/efficiency/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total production value for today
    const productionEntries = await ProductionEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          totalProductionValue: { $sum: "$productionValue" },
        },
      },
    ]);

    const totalProductionValue = productionEntries.length > 0
      ? productionEntries[0].totalProductionValue
      : 0;

    // Get all job types
    const jobTypes = await JobType.find({});
    const paidJobTypeIds = jobTypes
      .filter(job => job.paid)
      .map(job => job._id);

    // Get timeclock entries for today
    const timeclockEntries = await TimeclockEntry.find({
      userId: userId,
      startTime: { $gte: today },
      jobTypeId: { $in: paidJobTypeIds }
    });

    let totalPaidTimeInHours = 0;
    const now = new Date();

    timeclockEntries.forEach((entry) => {
      const endTime = entry.endTime || now;
      totalPaidTimeInHours += (endTime - entry.startTime) / (1000 * 60 * 60);
    });

    const efficiency = totalPaidTimeInHours > 0 
      ? (totalProductionValue / totalPaidTimeInHours)
      : 0;

    res.json({ efficiency: Math.round(efficiency * 100) / 100 });
  } catch (error) {
    console.error("Error calculating efficiency:", error);
    res.status(500).json({ message: "Error calculating efficiency", error: error.message });
  }
});

router.get("/today", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate hours worked
    const timeclockEntries = await TimeclockEntry.find({
      userId,
      startTime: { $gte: today },
    });

    let hoursWorked = 0;
    const now = new Date();
    timeclockEntries.forEach((entry) => {
      const endTime = entry.endTime || now;
      hoursWorked += (endTime - entry.startTime) / (1000 * 60 * 60);
    });

    // Get unique items pressed today
    const uniqueItemsPressed = await ProductionEntry.distinct("barcode", {
      userId,
      createdAt: { $gte: today },
    });

    res.json({
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      itemsPressed: uniqueItemsPressed.length,
    });
  } catch (error) {
    console.error("Error fetching today's stats:", error);
    res.status(500).json({ message: "Error fetching today's stats" });
  }
});

router.get("/session", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const latestTimeclockEntry = await TimeclockEntry.findOne({
      userId,
      endTime: null,
    }).sort({ startTime: -1 });

    if (!latestTimeclockEntry) {
      return res.json({ itemsProcessedThisSession: 0 });
    }

    const uniqueItemsProcessedThisSession = await ProductionEntry.distinct(
      "barcode",
      {
        userId,
        createdAt: { $gte: latestTimeclockEntry.startTime },
      }
    );

    res.json({
      itemsProcessedThisSession: uniqueItemsProcessedThisSession.length,
    });
  } catch (error) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ message: "Error fetching session stats" });
  }
});

router.get("/users/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await User.aggregate([
      {
        $lookup: {
          from: "timeclockentries",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $gte: ["$startTime", today] },
                    { $eq: [{ $type: "$endTime" }, "missing"] },
                  ],
                },
              },
            },
          ],
          as: "activeEntry",
        },
      },
      {
        $lookup: {
          from: "timeclockentries",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $gte: ["$startTime", today] },
                  ],
                },
              },
            },
          ],
          as: "allEntries",
        },
      },
      {
        $lookup: {
          from: "productionentries",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $gte: ["$createdAt", today] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalProductionValue: { $sum: "$productionValue" },
              },
            },
          ],
          as: "productionData",
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          efficiency: {
            $let: {
              vars: {
                totalTime: {
                  $reduce: {
                    input: "$allEntries",
                    initialValue: 0,
                    in: {
                      $add: [
                        "$$value",
                        {
                          $divide: [
                            {
                              $subtract: [
                                { $ifNull: ["$$this.endTime", new Date()] },
                                "$$this.startTime",
                              ],
                            },
                            3600000, // Convert milliseconds to hours
                          ],
                        },
                      ],
                    },
                  },
                },
                totalProduction: {
                  $ifNull: [
                    {
                      $arrayElemAt: ["$productionData.totalProductionValue", 0],
                    },
                    0,
                  ],
                },
              },
              in: {
                $cond: [
                  { $gt: ["$$totalTime", 0] },
                  { $divide: ["$$totalProduction", "$$totalTime"] },
                  0,
                ],
              },
            },
          },
          isClockedIn: { $gt: [{ $size: "$activeEntry" }, 0] },
        },
      },
    ]);

    console.log("Users data:", users);
    res.json(users);
  } catch (error) {
    console.error("Error fetching today's users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// New route for fetching user volumes
router.get("/users/today-volumes", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await User.find({});
    const userVolumes = await Promise.all(
      users.map(async (user) => {
        const itemsProcessed = await ProductionEntry.distinct("barcode", {
          userId: user._id,
          createdAt: { $gte: today },
        });

        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          itemsProcessed: itemsProcessed.length,
        };
      })
    );

    res.json(userVolumes);
  } catch (error) {
    console.error("Error fetching user volumes:", error);
    res.status(500).json({ message: "Error fetching user volumes" });
  }
});

module.exports = router;
