const express = require("express");
const router = express.Router();
const ProductionEntry = require("../models/ProductionEntry");
const User = require("../models/User");
const JobType = require("../models/JobType");

async function calculateItemsPressed(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const itemsPressed = await ProductionEntry.distinct("barcode", {
    userId: userId,
    createdAt: { $gte: today },
  });

  return itemsPressed.length;
}

router.post("/", async (req, res) => {
  try {
    const { userId, jobId, barcode, productionValue } = req.body;
    console.log("Received production data:", {
      userId,
      jobId,
      barcode,
      productionValue,
    });

    const newEntry = new ProductionEntry({
      userId,
      jobId,
      barcode,
      productionValue,
    });
    const savedEntry = await newEntry.save();
    console.log("New production entry saved:", savedEntry);

    const user = await User.findById(userId);
    const jobType = await JobType.findById(jobId);

    if (!user || !jobType) {
      console.error("User or JobType not found:", { userId, jobId });
      return res.status(404).json({ message: "User or JobType not found" });
    }

    // Calculate items pressed
    const itemsPressed = await calculateItemsPressed(userId);
    console.log("Items pressed calculated:", itemsPressed);

    // Emit WebSocket message
    const wss = req.app.get("wss");
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.userId === userId) {
          client.send(
            JSON.stringify({ type: "itemsPressed", count: itemsPressed })
          );
        }
      });
    } else {
      console.error("WebSocket server not found");
    }

    res.status(201).json({ savedEntry, itemsPressed });
  } catch (error) {
    console.error("Error in production route:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

module.exports = router;
