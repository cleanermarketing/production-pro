import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaCheck } from "react-icons/fa";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  payRate: number;
  department: string;
  payType: string; // Add this line
}

const EditUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPayRate, setEditPayRate] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPayType, setEditPayType] = useState(""); // Add this line

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/users`
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user._id);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPayRate(user.payRate.toFixed(2));
    setEditDepartment(user.department);
    setEditPayType(user.payType); // Add this line
  };

  const handleUpdate = async (id: string) => {
    try {
      const updatedUser = {
        firstName: editFirstName,
        lastName: editLastName,
        username: editUsername,
        role: editRole,
        payRate: parseFloat(editPayRate),
        department: editDepartment,
        payType: editPayType || undefined, // Send undefined if empty string
      };

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/${id}`,
        updatedUser
      );
      setEditingId(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {" "}
      {/* Added max-w-7xl */}
      <h2 className="text-2xl font-bold mb-4">Edit Users</h2>
      <div className="overflow-x-auto">
        {" "}
        {/* Added overflow-x-auto for horizontal scrolling if needed */}
        <table className="w-full border-collapse border border-gray-300 table-auto">
          {" "}
          {/* Added table-auto */}
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">First Name</th>
              <th className="border border-gray-300 px-4 py-2">Last Name</th>
              <th className="border border-gray-300 px-4 py-2">Username</th>
              <th className="border border-gray-300 px-4 py-2 w-1/6">
                Role
              </th>{" "}
              {/* Wider */}
              <th className="border border-gray-300 px-4 py-2">Pay Rate</th>
              <th className="border border-gray-300 px-4 py-2 w-1/6">
                Pay Type
              </th>{" "}
              {/* Wider */}
              <th className="border border-gray-300 px-4 py-2 w-1/6">
                Department
              </th>{" "}
              {/* Wider */}
              <th className="border border-gray-300 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                {/* First Name */}
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === user._id ? (
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    user.firstName
                  )}
                </td>
                {/* Last Name */}
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === user._id ? (
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    user.lastName
                  )}
                </td>
                {/* Username */}
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === user._id ? (
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    user.username
                  )}
                </td>
                {/* Role */}
                <td className="border border-gray-300 px-4 py-2 w-1/6">
                  {editingId === user._id ? (
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full p-1 border rounded"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                {/* Pay Rate */}
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === user._id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editPayRate}
                      onChange={(e) => setEditPayRate(e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    user.payRate.toFixed(2)
                  )}
                </td>
                {/* Pay Type */}
                <td className="border border-gray-300 px-4 py-2 w-1/6">
                  {editingId === user._id ? (
                    <select
                      value={editPayType}
                      onChange={(e) => setEditPayType(e.target.value)}
                      className="w-full p-1 border rounded"
                    >
                      <option value="">Select Pay Type</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Salary">Salary</option>
                    </select>
                  ) : (
                    user.payType || "\u00A0"
                  )}
                </td>
                {/* Department */}
                <td className="border border-gray-300 px-4 py-2 w-1/5">
                  {editingId === user._id ? (
                    <select
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full p-1 border rounded"
                    >
                      <option value="">Select Department</option>
                      <option value="Laundered Shirts">Laundered Shirts</option>
                      <option value="Dry Clean Press">Dry Clean Press</option>
                      <option value="Assembly">Assembly</option>
                      <option value="Wash & Fold">Wash & Fold</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Management">Management</option>
                    </select>
                  ) : (
                    user.department
                  )}
                </td>
                {/* Actions */}
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === user._id ? (
                    <button
                      onClick={() => handleUpdate(user._id)}
                      className="text-green-500 mr-2"
                    >
                      <FaCheck />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-500 mr-2"
                    >
                      <FaEdit />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-500"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EditUsers;
