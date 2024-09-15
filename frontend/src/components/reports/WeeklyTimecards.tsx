import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EditTimeclockModal from "../EditTimeclockModal";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { CSVLink } from "react-csv";

interface TimeclockEntry {
  _id: string;
  userId: string;
  jobTypeId: string;
  startTime: Date;
  endTime: Date | null;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

interface JobType {
  _id: string;
  name: string;
  paid: boolean;
}

interface DailyHours {
  paid: number;
  unpaid: number;
}

interface WeeklyData {
  user: User;
  weekData: {
    [key: string]: DailyHours;
  };
}

const WeeklyTimecards: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | null>(
    null
  );
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayEntries, setDayEntries] = useState<
    Array<{ entry: TimeclockEntry; jobType: JobType }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allJobTypes, setAllJobTypes] = useState<JobType[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (selectedDate) {
      const range = getWeekRange(selectedDate);
      setWeekRange(range);
      fetchWeeklyData(range.start, range.end);
    }
    fetchJobTypes();
  }, [selectedDate]);

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Set to Sunday
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Set to Saturday
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const fetchWeeklyData = async (start: Date, end: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/reports/weeklyTimecards`,
        {
          params: {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          },
        }
      );
      setWeeklyData(response.data);
    } catch (err) {
      setError("Failed to fetch weekly timecard data");
      console.error(err);
    }
    setIsLoading(false);
  };

  const fetchJobTypes = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/jobTypes");
      setAllJobTypes(response.data);
    } catch (error) {
      console.error("Error fetching job types:", error);
    }
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDayClick = (userId: string, day: string) => {
    setSelectedUser(userId);
    setSelectedDay(day);
    fetchDayEntries(userId, day);
  };

  const fetchDayEntries = async (userId: string, day: string) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/reports/dayEntries`,
        {
          params: {
            userId,
            date: day,
          },
        }
      );
      setDayEntries(response.data);
      console.log("Fetched day entries:", response.data); // Add this line for debugging
    } catch (error) {
      console.error("Error fetching day entries:", error);
    }
  };

  const handleCloseModal = () => {
    setSelectedDay(null);
    setDayEntries([]);
  };

  const handleSaveEdit = async (
    userId: string,
    updatedEntries: Array<{ entry: TimeclockEntry; jobType: JobType }>
  ) => {
    try {
      await axios.put(`http://localhost:5000/api/timeclock/update/${userId}`, {
        entries: updatedEntries,
      });
      if (weekRange) {
        fetchWeeklyData(weekRange.start, weekRange.end);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error updating timeclock entries:", error);
    }
  };

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, "0")}`;
  };

  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return `${start.toLocaleDateString(
      "en-US",
      options
    )} - ${end.toLocaleDateString("en-US", options)}`;
  };

  const generateDailyCSV = () => {
    const headers = [
      "Employee",
      "Date",
      "Paid Hours",
      "Unpaid Hours",
      "Total Hours",
    ];

    const rows = weeklyData.flatMap((userData) =>
      Object.entries(userData.weekData).map(([date, hours]) => [
        `${userData.user.firstName} ${userData.user.lastName}`,
        date,
        hours.paid.toFixed(2),
        hours.unpaid.toFixed(2),
        (hours.paid + hours.unpaid).toFixed(2),
      ])
    );

    return [headers, ...rows];
  };

  const generateWeeklySummaryCSV = () => {
    const headers = [
      "Employee",
      "Total Paid Hours",
      "Total Unpaid Hours",
      "Total Hours",
    ];

    const rows = weeklyData.map((userData) => {
      const totalPaid = Object.values(userData.weekData).reduce(
        (sum, hours) => sum + hours.paid,
        0
      );
      const totalUnpaid = Object.values(userData.weekData).reduce(
        (sum, hours) => sum + hours.unpaid,
        0
      );
      const total = totalPaid + totalUnpaid;

      return [
        `${userData.user.firstName} ${userData.user.lastName}`,
        totalPaid.toFixed(2),
        totalUnpaid.toFixed(2),
        total.toFixed(2),
      ];
    });

    return [headers, ...rows];
  };

  const calculateTotalPaidHours = (weekData: { [key: string]: DailyHours }) => {
    return Object.values(weekData).reduce((sum, hours) => sum + hours.paid, 0);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Weekly Timecards</h1>
      <div className="mb-4 flex items-center space-x-4">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          className="border p-2 rounded"
          calendarStartDay={0}
        />
        <CSVLink
          data={generateDailyCSV()}
          filename={`daily_summary_${
            weekRange?.start.toISOString().split("T")[0]
          }.csv`}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Download Daily Summary
        </CSVLink>
        <CSVLink
          data={generateWeeklySummaryCSV()}
          filename={`weekly_summary_${
            weekRange?.start.toISOString().split("T")[0]
          }.csv`}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Download Weekly Summary
        </CSVLink>
      </div>
      {weekRange && (
        <p className="mt-2 text-gray-600">
          Showing data for: {formatDateRange(weekRange.start, weekRange.end)}
        </p>
      )}
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-4">
        {weeklyData.map((userData) => {
          const totalPaidHours = calculateTotalPaidHours(userData.weekData);
          return (
            <div
              key={userData.user._id}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleUserExpand(userData.user._id)}
              >
                <h2 className="text-xl font-semibold">{`${userData.user.firstName} ${userData.user.lastName}`}</h2>
                <div className="flex items-center">
                  <span
                    className={`mr-4 px-3 py-1 rounded-full text-white ${
                      totalPaidHours < 40 ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {totalPaidHours.toFixed(2)} hours
                  </span>
                  {expandedUsers.includes(userData.user._id) ? (
                    <FaChevronUp />
                  ) : (
                    <FaChevronDown />
                  )}
                </div>
              </div>
              {expandedUsers.includes(userData.user._id) && (
                <div className="p-4 border-t">
                  <div className="grid grid-cols-7 gap-2">
                    {Object.entries(userData.weekData).map(([day, hours]) => (
                      <div
                        key={day}
                        className="border p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleDayClick(userData.user._id, day)}
                      >
                        <div className="font-semibold">
                          {new Date(day).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                        <div>Paid: {formatHours(hours.paid)}</div>
                        <div>Unpaid: {formatHours(hours.unpaid)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedDay && (
        <EditTimeclockModal
          isOpen={!!selectedDay}
          onClose={handleCloseModal}
          entries={dayEntries}
          onSave={(updatedEntries) =>
            handleSaveEdit(selectedUser!, updatedEntries)
          }
          allJobTypes={allJobTypes}
        />
      )}
    </div>
  );
};

export default WeeklyTimecards;
