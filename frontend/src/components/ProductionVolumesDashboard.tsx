import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  itemsProcessed: number;
}

const UserVolumeCard: React.FC<User> = ({
  firstName,
  lastName,
  itemsProcessed,
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 m-4">
      <h3 className="text-xl font-semibold mb-4">
        {firstName} {lastName}
      </h3>
      <div className="text-3xl font-bold text-center">{itemsProcessed}</div>
      <div className="text-sm text-gray-600 text-center mt-2">
        Items Processed Today
      </div>
    </div>
  );
};

const ProductionVolumesDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stats/users/today-volumes`
      );
      console.log("Fetched users:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();

    ws.current = new WebSocket(`ws://${process.env.WS_REACT_APP_API_URL}`);

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
      <h2 className="text-2xl font-bold mb-6">Production Volumes Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <UserVolumeCard
            key={`${user._id}-${user.firstName}-${user.lastName}`}
            {...user}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductionVolumesDashboard;
