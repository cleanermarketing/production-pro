import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import EfficiencyMeter from "./EfficiencyMeter";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  efficiency: number;
  isClockedIn: boolean;
}

const UserEfficiencyCard: React.FC<User> = ({
  firstName,
  lastName,
  efficiency,
  isClockedIn,
}) => {
  const roundedEfficiency = Math.round(efficiency);

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 m-2 flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2 text-center">
        {firstName} {lastName}
      </h3>
      <div
        className={`text-xs font-bold mb-2 p-1 rounded-full text-center w-full ${
          isClockedIn ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {isClockedIn ? "Currently Clocked In" : "Not Currently Clocked In"}
      </div>
      <EfficiencyMeter
        efficiency={roundedEfficiency}
        size={100}
        onColorChange={() => {}}
      />
    </div>
  );
};

const ProductionEfficiencyDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stats/users/today`
      );
      console.log("Fetched users:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();

    ws.current = new WebSocket(`${process.env.REACT_APP_WS_API_URL}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "refreshUsers") {
        fetchUsers();
      }
    };

    const interval = setInterval(fetchUsers, 3000);

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Production Efficiency Dashboard
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {users.map((user) => (
          <UserEfficiencyCard
            key={`${user._id}-${user.firstName}-${user.lastName}`}
            {...user}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductionEfficiencyDashboard;
