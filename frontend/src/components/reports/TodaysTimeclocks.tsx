import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EditTimeclockModal from "../EditTimeclockModal";

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

interface TimeclockData {
  user: User;
  entries: Array<{
    entry: TimeclockEntry;
    jobType: JobType;
  }>;
}

const TodaysTimeclocks: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [timeclockData, setTimeclockData] = useState<TimeclockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [allJobTypes, setAllJobTypes] = useState<JobType[]>([]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeclockData();
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchJobTypes();
  }, []);

  const fetchTimeclockData = async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching timeclock data...');
      console.log('API URL:', `${process.env.REACT_APP_API_URL}/api/reports/todaysTimeclocks`);
      console.log('Date:', selectedDate.toISOString());
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/reports/todaysTimeclocks`,
        {
          params: { date: selectedDate.toISOString() },
        }
      );
      console.log('Timeclock data response:', response.data);
      setTimeclockData(response.data);
    } catch (err: any) {
      console.error('Error fetching timeclock data:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError("Failed to fetch timeclock data");
    }
    setIsLoading(false);
  };

  const fetchJobTypes = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/jobTypes`);
      setAllJobTypes(response.data);
    } catch (error) {
      console.error("Error fetching job types:", error);
    }
  };

  const calculateDuration = (start: Date, end: Date | null): string => {
    if (!end) return "0:00";
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const sumDurations = (durations: string[]): string => {
    const totalMinutes = durations.reduce((sum, duration) => {
      const [hours, minutes] = duration.split(":").map(Number);
      return sum + hours * 60 + minutes;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleEditClick = (userId: string) => {
    setEditingUserId(userId);
  };

  const handleCloseEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveEdit = async (
    userId: string,
    updatedEntries: Array<{ entry: TimeclockEntry; jobType: JobType }>
  ) => {
    try {
      console.log('Updating timeclock entries...');
      console.log('API URL:', `${process.env.REACT_APP_API_URL}/api/timeclock/update/${userId}`);
      console.log('Updated entries:', updatedEntries);
      await axios.put(`${process.env.REACT_APP_API_URL}/api/timeclock/update/${userId}`, {
        entries: updatedEntries,
      });
      console.log('Timeclock entries updated successfully');
      fetchTimeclockData(); // Refetch data after update
      setEditingUserId(null);
    } catch (error: any) {
      console.error("Error updating timeclock entries:", error);
      console.error('Error details:', error.response?.data || error.message);
      // Handle error (e.g., show error message to user)
    }
  };

  // Add this new function to format time
  const formatTime = (date: Date | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Today's Timeclocks</h1>
      <div className="mb-4">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          className="border p-2 rounded"
        />
      </div>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeclockData.map((userData) => (
          <div
            key={userData.user._id}
            className="bg-white shadow-md rounded-lg p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{`${userData.user.firstName} ${userData.user.lastName}`}</h2>
              <button
                onClick={() => handleEditClick(userData.user._id)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Edit
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Clock In</th>
                  <th className="text-left">Clock Out</th>
                  <th className="text-left">Job</th>
                  <th className="text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {userData.entries.map((entry) => (
                  <tr key={entry.entry._id}>
                    <td>{formatTime(entry.entry.startTime)}</td>
                    <td>{formatTime(entry.entry.endTime)}</td>
                    <td>{entry.jobType.name}</td>
                    <td>
                      {calculateDuration(
                        entry.entry.startTime,
                        entry.entry.endTime
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="text-right font-semibold pt-2">
                    Paid:
                  </td>
                  <td className="pt-2">
                    {sumDurations(
                      userData.entries
                        .filter((entry) => entry.jobType.paid)
                        .map((entry) =>
                          calculateDuration(
                            entry.entry.startTime,
                            entry.entry.endTime
                          )
                        )
                    )}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right font-semibold">
                    Not Paid:
                  </td>
                  <td>
                    {sumDurations(
                      userData.entries
                        .filter((entry) => !entry.jobType.paid)
                        .map((entry) =>
                          calculateDuration(
                            entry.entry.startTime,
                            entry.entry.endTime
                          )
                        )
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}
      </div>
      {editingUserId && (
        <EditTimeclockModal
          isOpen={!!editingUserId}
          onClose={handleCloseEdit}
          entries={
            timeclockData.find((data) => data.user._id === editingUserId)
              ?.entries || []
          }
          onSave={(updatedEntries) =>
            handleSaveEdit(editingUserId, updatedEntries)
          }
          allJobTypes={allJobTypes}
        />
      )}
    </div>
  );
};

export default TodaysTimeclocks;
