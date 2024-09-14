import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaCheck } from "react-icons/fa";

interface Job {
  _id: string;
  name: string;
  expectedPPOH: number;
  paid: boolean;
  department: string;
}

const EditJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPPOH, setEditPPOH] = useState("");
  const [editPaid, setEditPaid] = useState(false);
  const [editDepartment, setEditDepartment] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/jobTypes");
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingId(job._id);
    setEditName(job.name);
    setEditPPOH(job.expectedPPOH.toString());
    setEditPaid(job.paid);
    setEditDepartment(job.department);
  };

  const handleUpdate = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/jobTypes/${id}`, {
        name: editName,
        expectedPPOH: parseFloat(editPPOH),
        paid: editPaid,
        department: editDepartment,
      });
      setEditingId(null);
      fetchJobs();
    } catch (error) {
      console.error("Error updating job:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.delete(`http://localhost:5000/api/jobTypes/${id}`);
        fetchJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Edit Jobs</h2>
      <div className="shadow-lg rounded-lg overflow-hidden">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Job Name</th>
              <th className="border border-gray-300 px-4 py-2">
                Expected PPOH
              </th>
              <th className="border border-gray-300 px-4 py-2">Paid</th>
              <th className="border border-gray-300 px-4 py-2">Department</th>
              <th className="border border-gray-300 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id}>
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === job._id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    job.name
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === job._id ? (
                    <input
                      type="number"
                      value={editPPOH}
                      onChange={(e) => setEditPPOH(e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    job.expectedPPOH
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === job._id ? (
                    <input
                      type="checkbox"
                      checked={editPaid}
                      onChange={(e) => setEditPaid(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  ) : job.paid ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === job._id ? (
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
                    </select>
                  ) : (
                    job.department
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {editingId === job._id ? (
                    <button
                      onClick={() => handleUpdate(job._id)}
                      className="text-green-500 mr-2"
                    >
                      <FaCheck />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(job)}
                      className="text-blue-500 mr-2"
                    >
                      <FaEdit />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(job._id)}
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

export default EditJobs;
