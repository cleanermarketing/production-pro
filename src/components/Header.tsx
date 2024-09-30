import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../UserContext";
import ClockOutReasonModal from "./ClockOutReasonModal";

interface JobType {
  _id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

const Header: React.FC = () => {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [currentEntry, setCurrentEntry] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { isClockedIn, setIsClockedIn, setItemsPressed } = useUser();
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  useEffect(() => {
    fetchJobTypes();
    checkClockStatus();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchJobTypes = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/timeclock/jobtypes`
      );
      setJobTypes(response.data);
    } catch (error) {
      console.error("Error fetching job types:", error);
    }
  };

  const checkClockStatus = async () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      try {
        console.log("Checking clock status for user:", user.id);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/timeclock/current?userId=${user.id}`
        );
        console.log("Clock status response:", response.data);
        if (response.data && response.data.currentEntry) {
          setIsClockedIn(true);
          setCurrentEntry(response.data.currentEntry._id);
          setSelectedJob(response.data.currentEntry.jobTypeId);
        } else {
          setIsClockedIn(false);
          setCurrentEntry(null);
          setSelectedJob("");
        }
      } catch (error: any) {
        console.error(
          "Error checking clock status:",
          error.response?.data || error.message
        );
        setIsClockedIn(false);
        setCurrentEntry(null);
        setSelectedJob("");
      }
    }
  };

  const fetchCurrentJob = async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/timeclock/current?userId=${user.id}`
      );
      if (response.data && response.data.jobType) {
        setSelectedJob(response.data.jobType._id);
      }
    } catch (error) {
      console.error("Error fetching current job:", error);
    }
  };

  const handleClockIn = async () => {
    if (!user || !selectedJob) {
      console.error("No user logged in or no job selected");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/timeclock/clockin`,
        {
          userId: user.id,
          jobTypeId: selectedJob,
        }
      );
      console.log("Clock in response:", response.data);
      setIsClockedIn(true);
      setCurrentEntry(response.data.entry._id);
      setItemsPressed(response.data.itemsPressed);
      console.log("User clocked in, isClockedIn set to true");
    } catch (error: any) {
      console.error(
        "Error clocking in:",
        error.response?.data || error.message
      );
    }
  };

  const handleClockOut = async (reason?: string) => {
    if (!currentEntry) {
      console.error("No current entry to clock out from");
      return;
    }
    if (!reason) {
      setShowClockOutModal(true);
      return;
    }
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/timeclock/clockout/${currentEntry}`,
        { clockOutReason: reason }
      );
      setIsClockedIn(false);
      setCurrentEntry(null);
      setSelectedJob("");
      setItemsPressed(0);
      console.log("User clocked out, isClockedIn set to false");
    } catch (error) {
      console.error("Error clocking out:", error);
    }
  };

  const handleClockOutConfirm = (reason: string) => {
    setShowClockOutModal(false);
    handleClockOut(reason);
  };

  return (
    <header className="bg-white shadow-lg h-16 flex items-center justify-between px-6">
      <div className="flex items-center"></div>
      <div className="flex items-center">
        {user && (
          <>
            {isClockedIn ? (
              <>
                <span className="mr-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  Clocked in
                </span>
                <button
                  onClick={() => handleClockOut()}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  Clock Out
                </button>
              </>
            ) : (
              <>
                <span className="mr-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  Not clocked in
                </span>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="mr-2 border rounded py-2 px-3"
                >
                  <option value="">Select a job</option>
                  {jobTypes.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleClockIn}
                  disabled={!selectedJob}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  Clock In
                </button>
              </>
            )}
          </>
        )}
      </div>
      <ClockOutReasonModal
        isOpen={showClockOutModal}
        onClose={() => setShowClockOutModal(false)}
        onConfirm={handleClockOutConfirm}
        className="z-50"
      />
    </header>
  );
};

export default Header;
