const express = require("express");
const router = express.Router();
const JobType = require("../models/JobType");
// const auth = require("../middleware/auth");

router.post("/", async (req, res) => {
  try {
    const { name, expectedPPOH } = req.body;
    const newJobType = new JobType({ name, expectedPPOH });
    await newJobType.save();
    res.status(201).json(newJobType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const jobTypes = await JobType.find();
    res.json(jobTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, expectedPPOH, paid, department } = req.body;
    const updatedJobType = await JobType.findByIdAndUpdate(
      req.params.id,
      { name, expectedPPOH, paid, department },
      { new: true }
    );
    if (!updatedJobType) {
      return res.status(404).json({ message: "Job type not found" });
    }
    res.json(updatedJobType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedJobType = await JobType.findByIdAndDelete(req.params.id);
    if (!deletedJobType) {
      return res.status(404).json({ message: "Job type not found" });
    }
    res.json({ message: "Job type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New route for fetching job types with PPOH goals
router.get("/with-ppoh-goals", async (req, res) => {
  try {
    const jobTypes = await JobType.find().select("name expectedPPOH");
    res.json(jobTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
