// backend/routes/reports.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const TimeclockEntry = require("../models/TimeclockEntry");
const ProductionEntry = require("../models/ProductionEntry");
const JobType = require("../models/JobType");

router.get("/productivity-by-employee", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const productivityData = await User.aggregate([
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
                    { $gte: ["$startTime", start] },
                    { $lte: ["$endTime", end] },
                  ],
                },
              },
            },
          ],
          as: "timeclockEntries",
        },
      },
      {
        $unwind: "$timeclockEntries",
      },
      {
        $lookup: {
          from: "productionentries",
          let: {
            userId: "$_id",
            jobTypeId: "$timeclockEntries.jobTypeId",
            startTime: "$timeclockEntries.startTime",
            endTime: "$timeclockEntries.endTime",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$jobId", "$$jobTypeId"] },
                    { $gte: ["$createdAt", "$$startTime"] },
                    { $lte: ["$createdAt", "$$endTime"] },
                  ],
                },
              },
            },
          ],
          as: "productionEntries",
        },
      },
      {
        $lookup: {
          from: "jobtypes",
          localField: "timeclockEntries.jobTypeId",
          foreignField: "_id",
          as: "jobType",
        },
      },
      {
        $unwind: "$jobType",
      },
      {
        $group: {
          _id: {
            userId: "$_id",
            firstName: "$firstName",
            lastName: "$lastName",
            jobTypeId: "$jobType._id",
            jobTypeName: "$jobType.name",
          },
          hoursWorked: {
            $sum: {
              $divide: [
                {
                  $subtract: [
                    "$timeclockEntries.endTime",
                    "$timeclockEntries.startTime",
                  ],
                },
                3600000,
              ],
            },
          },
          piecesCompleted: { $sum: { $size: "$productionEntries" } },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id.userId",
          firstName: "$_id.firstName",
          lastName: "$_id.lastName",
          jobType: "$_id.jobTypeName",
          hoursWorked: 1,
          piecesCompleted: 1,
          pph: {
            $cond: [
              { $eq: ["$hoursWorked", 0] },
              0,
              { $divide: ["$piecesCompleted", "$hoursWorked"] },
            ],
          },
          efficiency: {
            $cond: [
              { $eq: ["$hoursWorked", 0] },
              0,
              {
                $divide: [
                  { $divide: ["$piecesCompleted", "$hoursWorked"] },
                  "$jobType.expectedPPOH",
                ],
              },
            ],
          },
          goalReached: {
            $gte: [
              { $divide: ["$piecesCompleted", "$hoursWorked"] },
              "$jobType.expectedPPOH",
            ],
          },
        },
      },
      {
        $sort: { lastName: 1, firstName: 1, jobType: 1 },
      },
    ]);

    res.json(productivityData);
  } catch (error) {
    console.error("Error fetching productivity data:", error);
    res.status(500).json({ message: "Error fetching productivity data" });
  }
});

router.get("/todaysTimeclocks", async (req, res) => {
  try {
    const { date } = req.query;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await TimeclockEntry.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ startTime: 1 });

    const userIds = [...new Set(entries.map((entry) => entry.userId))];
    const users = await User.find({ _id: { $in: userIds } });
    const jobTypes = await JobType.find();

    const timeclockData = await Promise.all(
      users.map(async (user) => {
        const userEntries = entries.filter(
          (entry) => entry.userId.toString() === user._id.toString()
        );
        const entryData = await Promise.all(
          userEntries.map(async (entry) => {
            const jobType = jobTypes.find(
              (jt) => jt._id.toString() === entry.jobTypeId.toString()
            );
            return { entry, jobType };
          })
        );

        return {
          user,
          entries: entryData,
        };
      })
    );

    res.json(timeclockData);
  } catch (error) {
    console.error("Error fetching today's timeclocks:", error);
    res.status(500).json({ message: "Error fetching today's timeclocks" });
  }
});

router.get("/weeklyTimecards", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const entries = await TimeclockEntry.find({
      startTime: { $gte: start, $lte: end },
    })
      .populate("userId")
      .populate("jobTypeId");

    const weeklyData = {};

    entries.forEach((entry) => {
      const userId = entry.userId._id.toString();
      const day = entry.startTime.toISOString().split("T")[0];
      const duration =
        (entry.endTime ? entry.endTime - entry.startTime : 0) /
        (1000 * 60 * 60);

      if (!weeklyData[userId]) {
        weeklyData[userId] = {
          user: {
            _id: entry.userId._id,
            firstName: entry.userId.firstName,
            lastName: entry.userId.lastName,
          },
          weekData: {},
        };
      }

      if (!weeklyData[userId].weekData[day]) {
        weeklyData[userId].weekData[day] = { paid: 0, unpaid: 0 };
      }

      if (entry.jobTypeId.paid) {
        weeklyData[userId].weekData[day].paid += duration;
      } else {
        weeklyData[userId].weekData[day].unpaid += duration;
      }
    });

    res.json(Object.values(weeklyData));
  } catch (error) {
    console.error("Error fetching weekly timecard data:", error);
    res.status(500).json({ message: "Error fetching weekly timecard data" });
  }
});

router.get("/dayEntries", async (req, res) => {
  try {
    const { userId, date } = req.query;
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const entries = await TimeclockEntry.find({
      userId,
      startTime: { $gte: startOfDay, $lt: endOfDay },
    }).populate("jobTypeId");

    const formattedEntries = entries.map((entry) => ({
      entry: entry.toObject(),
      jobType: entry.jobTypeId,
    }));

    res.json(formattedEntries);
  } catch (error) {
    console.error("Error fetching day entries:", error);
    res.status(500).json({ message: "Error fetching day entries" });
  }
});

module.exports = router;
