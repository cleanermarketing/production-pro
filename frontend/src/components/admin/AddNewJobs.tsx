import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddNewJobs: React.FC = () => {
  const [jobName, setJobName] = useState("");
  const [expectedPPOH, setExpectedPPOH] = useState("");
  const [paid, setPaid] = useState(false);
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post("http://localhost:5000/api/jobTypes", {
        name: jobName,
        expectedPPOH: parseFloat(expectedPPOH),
        paid,
        department,
      });

      if (response.status === 201) {
        setSuccess("Job Successfully Added");
        setJobName("");
        setExpectedPPOH("");
        setPaid(false);
        setDepartment("");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "An error occurred while adding the job"
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-full max-w-md m-auto">
        <form
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          onSubmit={handleSubmit}
        >
          <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900">
            Add New Job
          </h2>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="jobName"
            >
              Job Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="jobName"
              type="text"
              placeholder="Job Name"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="expectedPPOH"
            >
              Expected PPOH
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="expectedPPOH"
              type="number"
              step="0.01"
              placeholder="Expected PPOH"
              value={expectedPPOH}
              onChange={(e) => setExpectedPPOH(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="paid"
            >
              Paid
            </label>
            <input
              className="mr-2 leading-tight"
              id="paid"
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
            />
            <span className="text-sm">Is this a paid job?</span>
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="department"
            >
              Department
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="">Select Department</option>
              <option value="Laundered Shirts">Laundered Shirts</option>
              <option value="Dry Clean Press">Dry Clean Press</option>
              <option value="Assembly">Assembly</option>
              <option value="Wash & Fold">Wash & Fold</option>
              <option value="Cleaning">Cleaning</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          {success && (
            <p className="text-green-500 text-xs italic mb-4">{success}</p>
          )}
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Add Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewJobs;
