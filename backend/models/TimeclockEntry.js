const mongoose = require("mongoose");

const TimeclockEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobType",
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  totalHours: {
    type: Number,
  },
  clockOutReason: {
    type: String,
    enum: ["End Shift", "Change Jobs", "Break", "Ran Out Of Pieces"],
  },
});

module.exports = mongoose.model("TimeclockEntry", TimeclockEntrySchema);
