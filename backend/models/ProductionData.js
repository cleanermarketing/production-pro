const mongoose = require("mongoose");

const ProductionDataSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  jobTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "JobType" },
  piecesPressed: Number,
  clockedInTime: Number,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ProductionData", ProductionDataSchema);
