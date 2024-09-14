const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Add new user
router.post("/", async (req, res) => {
  try {
    console.log("Received user data:", req.body);
    const {
      firstName,
      lastName,
      username,
      password,
      role,
      payRate,
      department,
      payType,
    } = req.body;

    // Check if all required fields are present
    if (
      !firstName ||
      !lastName ||
      !username ||
      !password ||
      !payRate ||
      !department ||
      !payType
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({
      firstName,
      lastName,
      username,
      password,
      role: role || "employee",
      payRate,
      department,
      payType,
    });

    console.log("Creating new user:", newUser);

    await newUser.save();

    console.log("User saved successfully");

    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      message: "Error creating user",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      role,
      payRate,
      department,
      payType,
    } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, username, role, payRate, department, payType },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
