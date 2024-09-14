const mongoose = require("mongoose");

const JobTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  expectedPPOH: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  department: {
    type: String,
    enum: [
      "Laundered Shirts",
      "Dry Clean Press",
      "Assembly",
      "Wash & Fold",
      "Cleaning",
    ],
  },
});

module.exports = mongoose.model("JobType", JobTypeSchema);
