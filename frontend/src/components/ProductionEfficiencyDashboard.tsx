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

  console.log(`User ${firstName} ${lastName} isClockedIn:`, isClockedIn);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 m-4">
      <h3 className="text-xl font-semibold mb-4">
        {firstName} {lastName}
      </h3>
      <div
        className={`text-sm font-bold mb-4 p-2 rounded-full text-center ${
          isClockedIn ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {isClockedIn ? "Currently Clocked In" : "Not Currently Clocked In"}
      </div>
      <EfficiencyMeter
        efficiency={roundedEfficiency}
        size={150}
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

    ws.current = new WebSocket("ws://${process.env.WS_REACT_APP_API_URL}");

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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">
        Production Efficiency Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
