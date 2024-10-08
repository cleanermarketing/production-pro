import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../UserContext";
import EfficiencyMeter from "./EfficiencyMeter";
import PPOHVsGoalMeter from "./PPOHVsGoalMeter";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface JobType {
  _id: string;
  name: string;
  expectedPPOH: number;
  paid: boolean;
}

const Production: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentJob, setCurrentJob] = useState<JobType | null>(null);
  const [barcode, setBarcode] = useState("");
  const { isClockedIn, itemsPressed, setItemsPressed } = useUser();

  const [sessionItemsPressed, setSessionItemsPressed] = useState(0);
  const [sessionHours, setSessionHours] = useState(0);
  const [actualPPOH, setActualPPOH] = useState(0);
  const [ppohDifference, setPpohDifference] = useState(0);
  const [efficiency, setEfficiency] = useState(0);
  const [hoursWorked, setHoursWorked] = useState<{ paid: number; unpaid: number }>({ paid: 0, unpaid: 0 });
  const [backgroundColor, setBackgroundColor] = useState(
    "rgba(255, 255, 255, 0.9)"
  );

  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [sessionItemsProcessed, setSessionItemsProcessed] = useState(0);

  const isOnPaidJob = currentJob?.paid ?? false;

  const fetchTodaySummary = async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stats/today?userId=${user.id}`
      );
      console.log("Today's summary response:", response.data);
      setHoursWorked({
        paid: response.data.paidHours || 0,
        unpaid: response.data.unpaidHours || 0
      });
      console.log("Hours worked set to:", {
        paid: response.data.paidHours || 0,
        unpaid: response.data.unpaidHours || 0
      });
    } catch (error) {
      console.error("Error fetching today's summary:", error);
    }
  };

  useEffect(() => {
    console.log("Production component useEffect triggered");
    console.log("isClockedIn:", isClockedIn);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log("User found in localStorage:", parsedUser);
      setUser(parsedUser);
      if (isClockedIn) {
        console.log("Fetching current job...");
        fetchCurrentJob(parsedUser.id);
      } else {
        console.log("User is not clocked in, setting currentJob to null");
        setCurrentJob(null);
      }
    }
  }, [isClockedIn]);

  useEffect(() => {
    if (user) {
      const ws = new WebSocket(`${process.env.REACT_APP_WS_API_URL}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify({ type: "subscribe", userId: user.id }));
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        if (data.type === "itemsPressed") {
          setItemsPressed(data.count);
          fetchEfficiencyAndPPOH();
          fetchSessionItemsProcessed();
        }
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    }
  }, [user, setItemsPressed]);

  useEffect(() => {
    if (user && isClockedIn) {
      fetchEfficiencyAndPPOH();
      const interval = setInterval(fetchEfficiencyAndPPOH, 5000);
      return () => clearInterval(interval);
    }
  }, [user, isClockedIn]);

  useEffect(() => {
    if (user && isClockedIn) {
      fetchSessionItemsProcessed();
    }
  }, [user, isClockedIn]);

  useEffect(() => {
    if (user) {
      fetchTodaySummary();
      const interval = setInterval(fetchTodaySummary, 5000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchCurrentJob = async (userId: string) => {
    try {
      console.log("Fetching current job for user:", userId);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/timeclock/current?userId=${userId}`
      );
      console.log("Current job response:", response.data);
      if (
        response.data &&
        response.data.currentEntry &&
        response.data.currentEntry.jobTypeId
      ) {
        console.log(
          "Setting current job:",
          response.data.currentEntry.jobTypeId
        );
        setCurrentJob(response.data.currentEntry.jobTypeId);
      } else {
        console.log("No current job found, setting currentJob to null");
        setCurrentJob(null);
      }
    } catch (error) {
      console.error("Error fetching current job:", error);
      setCurrentJob(null);
    }
  };

  const fetchEfficiencyAndPPOH = async () => {
    if (!user) return;
    try {
      const [efficiencyResponse, ppohResponse, itemsPressedResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/stats/efficiency/${user.id}`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/timeclock/session-stats/${user.id}`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/stats/items-pressed/${user.id}`),
      ]);

      setEfficiency(Math.round(efficiencyResponse.data.efficiency));
      
      const { sessionItemsPressed, sessionHours } = ppohResponse.data;
      setSessionItemsPressed(sessionItemsPressed);
      setSessionHours(sessionHours);
      
      if (sessionHours > 0) {
        const calculatedPPOH = sessionItemsPressed / sessionHours;
        setActualPPOH(calculatedPPOH);
        setPpohDifference(calculatedPPOH - (currentJob?.expectedPPOH || 0));
      }
      
      setItemsPressed(itemsPressedResponse.data.itemsPressed);
    } catch (error) {
      console.error("Error fetching efficiency and PPOH:", error);
      // You might want to set some default values or show an error message to the user
    }
  };

  const fetchSessionItemsProcessed = async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stats/session?userId=${user.id}`
      );
      setSessionItemsProcessed(response.data.itemsProcessedThisSession);
    } catch (error) {
      console.error("Error fetching session items processed:", error);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentJob || !barcode) {
      console.error("Missing required data:", { user, currentJob, barcode });
      return;
    }

    const productionValue = 100 / currentJob.expectedPPOH;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/production`,
        {
          userId: user.id,
          jobId: currentJob._id,
          barcode,
          productionValue,
        }
      );
      console.log("Production data submitted successfully:", response.data);
      setBarcode("");
      fetchEfficiencyAndPPOH();
    } catch (error: any) {
      console.error(
        "Error submitting production data:",
        error.response?.data || error.message
      );
      // Add error message for the user here
    }
  };

  const ppohVsGoal = actualPPOH - (currentJob?.expectedPPOH || 0);
  const color = ppohVsGoal >= 0 ? "text-green-500" : "text-red-500";

  const TodaySummary: React.FC<{
    hoursWorked: { paid: number; unpaid: number };
    itemsPressed: number;
  }> = ({ hoursWorked, itemsPressed }) => {
    console.log("TodaySummary rendered with:", { hoursWorked, itemsPressed });
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col h-full">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Today's Summary
        </h2>
        <div className="flex flex-col justify-between flex-grow">
          <div className="mb-4">
            <p className="font-semibold mb-2">Hours Worked:</p>
            <div className="flex justify-between items-center">
              <span>Paid:</span>
              <span className="text-xl font-bold">{(hoursWorked?.paid || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Unpaid:</span>
              <span className="text-xl font-bold">{(hoursWorked?.unpaid || 0).toFixed(2)}</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">Items Processed:</p>
            <p className="text-2xl font-bold">{itemsPressed}</p>
          </div>
        </div>
      </div>
    );
  };

  const SessionItemsProcessed: React.FC<{ itemsProcessed: number }> = ({
    itemsProcessed,
  }) => {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">
          Items Processed This Session
        </h2>
        <div className="text-4xl font-bold">{itemsProcessed}</div>
      </div>
    );
  };

  const adjustColorOpacity = (color: string, opacity: number) => {
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  };

  return (
    <div
      className="flex flex-col h-full overflow-auto"
      style={{ backgroundColor }}
    >
      <div className="flex-grow p-4">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Welcome, {user?.firstName}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Scan Items
            </h2>
            {isClockedIn && isOnPaidJob ? (
              <form onSubmit={handleBarcodeSubmit}>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan barcode"
                  className="w-full mb-4 p-2 border rounded"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Submit
                </button>
              </form>
            ) : (
              <p className="text-center">
                Please clock in to start production.
              </p>
            )}
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4">Today's Efficiency</h2>
            <EfficiencyMeter
              efficiency={efficiency}
              size={150}
              onColorChange={(color) =>
                setBackgroundColor(adjustColorOpacity(color, 0.9))
              }
            />
          </div>
          {isClockedIn && isOnPaidJob && (
            <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold mb-2">PPOH This Session</h2>
              <PPOHVsGoalMeter
                actualPPOH={actualPPOH}
                goalPPOH={currentJob?.expectedPPOH || 1}
                size={150}
              />
            </div>
          )}
          {isClockedIn && isOnPaidJob && (
            <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center">
              <div className="mb-4 text-center">
                <p className="text-lg font-semibold">Goal PPOH</p>
                <p className="text-4xl font-bold">{currentJob?.expectedPPOH || "N/A"}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">Actual PPOH</p>
                <p className="text-4xl font-bold">{Math.round(actualPPOH)}</p>
              </div>
            </div>
          )}
          {isClockedIn && isOnPaidJob && (
            <SessionItemsProcessed itemsProcessed={sessionItemsProcessed} />
          )}
          <TodaySummary hoursWorked={hoursWorked} itemsPressed={itemsPressed} />
        </div>
      </div>
    </div>
  );
};

export default Production;
