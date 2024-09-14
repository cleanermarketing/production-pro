const mongoose = require("mongoose");

const ProductionEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobType",
    required: true,
  },
  barcode: {
    type: String,
    required: true,
  },
  productionValue: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ProductionEntry", ProductionEntrySchema);
