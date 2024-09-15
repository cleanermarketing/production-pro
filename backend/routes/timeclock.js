const express = require("express");
const router = express.Router();
const TimeclockEntry = require("../models/TimeclockEntry");
const JobType = require("../models/JobType");
const ProductionEntry = require("../models/ProductionEntry");

// Clock In
router.post("/clockin", async (req, res) => {
  try {
    const { userId, jobTypeId } = req.body;
    const newEntry = new TimeclockEntry({
      userId,
      jobTypeId,
      startTime: new Date(),
    });
    await newEntry.save();

    // Calculate initial items pressed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemsPressed = await ProductionEntry.distinct("barcode", {
      userId: userId,
      createdAt: { $gte: today },
    });

    res
      .status(201)
      .json({ entry: newEntry, itemsPressed: itemsPressed.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clock Out
router.put("/clockout/:entryId", async (req, res) => {
  try {
    const { clockOutReason } = req.body;
    const entry = await TimeclockEntry.findById(req.params.entryId);
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    entry.endTime = new Date();
    entry.totalHours = (entry.endTime - entry.startTime) / (1000 * 60 * 60);
    entry.clockOutReason = clockOutReason;
    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Job Types
router.get("/jobtypes", async (req, res) => {
  try {
    const jobTypes = await JobType.find();
    res.json(jobTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch current job for the logged-in user
router.get("/current", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const currentEntry = await TimeclockEntry.findOne({
      userId: userId,
      endTime: null,
    }).populate("jobTypeId");
    if (currentEntry) {
      res.json({ isClockedIn: true, currentEntry: currentEntry });
    } else {
      res.json({ isClockedIn: false });
    }
  } catch (error) {
    console.error("Error in /current route:", error);
    res.status(500).json({ message: error.message });
  }
});

// Session Stats
router.get("/session-stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentEntry = await TimeclockEntry.findOne({
      userId,
      endTime: null,
    }).sort({ startTime: -1 });

    if (!currentEntry) {
      return res.status(404).json({ message: "No active session found" });
    }

    const sessionStart = currentEntry.startTime;
    const now = new Date();
    const sessionHours = (now - sessionStart) / (1000 * 60 * 60);

    const sessionItemsPressed = await ProductionEntry.countDocuments({
      userId,
      createdAt: { $gte: sessionStart },
    });

    res.json({ sessionItemsPressed, sessionHours });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Timeclock Entries
router.put("/update/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { entries } = req.body;

    for (let entry of entries) {
      await TimeclockEntry.findByIdAndUpdate(entry.entry._id, {
        startTime: entry.entry.startTime,
        endTime: entry.entry.endTime,
        jobTypeId: entry.jobType._id,
      });
    }

    res.json({ message: "Timeclock entries updated successfully" });
  } catch (error) {
    console.error("Error updating timeclock entries:", error);
    res.status(500).json({ message: "Error updating timeclock entries" });
  }
});

module.exports = router;
