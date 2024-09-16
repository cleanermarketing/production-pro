// src/components/ProductivityByEmployeeReport.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ProductivityData {
  userId: string;
  firstName: string;
  lastName: string;
  jobType: string;
  hoursWorked: number;
  piecesCompleted: number;
  ppoh: number;
  ppohGoal: number;
}

const groupProductivityDataByEmployee = (data: ProductivityData[]) => {
  return data.reduce((acc, curr) => {
    const employeeName = `${curr.firstName} ${curr.lastName}`;
    if (!acc[employeeName]) {
      acc[employeeName] = [];
    }
    acc[employeeName].push(curr);
    return acc;
  }, {} as Record<string, ProductivityData[]>);
};

const ProductivityByEmployeeReport: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [productivityData, setProductivityData] = useState<ProductivityData[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductivityData();
  }, [startDate, endDate]);

  const fetchProductivityData = async () => {
    try {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [productivityResponse, jobTypesResponse] = await Promise.all([
        axios.get(
          `${process.env.REACT_APP_API_URL}/api/reports/productivity-by-employee`,
          {
            params: {
              startDate: startOfDay.toISOString(),
              endDate: endOfDay.toISOString(),
            },
          }
        ),
        axios.get(
          `${process.env.REACT_APP_API_URL}/api/jobTypes/with-ppoh-goals`
        ),
      ]);

      const productivityData = productivityResponse.data;
      const jobTypes = jobTypesResponse.data;

      const updatedProductivityData = productivityData.map(
        (data: ProductivityData) => {
          const jobType = jobTypes.find((jt: any) => jt.name === data.jobType);
          return {
            ...data,
            ppohGoal: jobType ? jobType.expectedPPOH : null,
          };
        }
      );

      setProductivityData(updatedProductivityData);
      setError(null);
    } catch (error) {
      console.error("Error fetching productivity data:", error);
      setError("Error fetching productivity data. Please try again.");
    }
  };

  const generateCSV = () => {
    const headers = [
      "Employee",
      "Job Type",
      "Hours Worked",
      "Pieces Completed",
      "PPOH",
      "PPOH Goal",
      "PPOH VS Goal",
    ];
    const rows = productivityData.map((data) => [
      `${data.firstName} ${data.lastName}`,
      data.jobType,
      data.hoursWorked.toFixed(2),
      data.piecesCompleted,
      Math.round(data.piecesCompleted / data.hoursWorked),
      Math.round(data.ppohGoal),
      `${Math.round(
        (data.piecesCompleted / data.hoursWorked / data.ppohGoal) * 100
      )}%`,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    return csvContent;
  };

  const handleDownload = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "productivity_report.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderTableRow = (
    data: ProductivityData,
    index: number,
    employeeName: string,
    employeeDataLength: number
  ) => {
    const calculatedPPOH =
      data.hoursWorked && data.piecesCompleted
        ? Math.round(data.piecesCompleted / data.hoursWorked)
        : null;

    const ppohVsGoal =
      calculatedPPOH && data.ppohGoal
        ? Math.round((calculatedPPOH / data.ppohGoal) * 100)
        : null;

    return (
      <tr
        key={`${employeeName}-${index}`}
        className={index % 2 === 0 ? "bg-gray-50" : ""}
      >
        {index === 0 && (
          <td
            className="border border-gray-300 p-2"
            rowSpan={employeeDataLength}
          >
            {employeeName}
          </td>
        )}
        <td className="border border-gray-300 p-2">{data.jobType}</td>
        <td className="border border-gray-300 p-2 text-center">
          {data.hoursWorked?.toFixed(2) ?? "N/A"}
        </td>
        <td className="border border-gray-300 p-2 text-center">
          {data.piecesCompleted ?? "N/A"}
        </td>
        <td className="border border-gray-300 p-2 text-center">
          {calculatedPPOH ?? "N/A"}
        </td>
        <td className="border border-gray-300 p-2 text-center">
          {data.ppohGoal ? Math.round(data.ppohGoal) : "N/A"}
        </td>
        <td
          className={`border border-gray-300 p-2 text-center ${
            ppohVsGoal && ppohVsGoal > 100 ? "font-bold text-green-500" : ""
          }`}
        >
          {ppohVsGoal ? `${ppohVsGoal}%` : "N/A"}
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Productivity by Employee</h2>
      <div className="mb-4 flex space-x-4 items-end">
        <div>
          <label className="block mb-2">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => date && setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
          />
        </div>
        <div>
          <label className="block mb-2">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => date && setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
          />
        </div>
        <button
          onClick={handleDownload}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Download CSV
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Employee</th>
            <th className="border border-gray-300 p-2">Job Type</th>
            <th className="border border-gray-300 p-2">Hours Worked</th>
            <th className="border border-gray-300 p-2">Pieces Completed</th>
            <th className="border border-gray-300 p-2">PPOH</th>
            <th className="border border-gray-300 p-2">PPOH Goal</th>
            <th className="border border-gray-300 p-2">PPOH VS Goal</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(
            groupProductivityDataByEmployee(productivityData)
          ).map(([employeeName, employeeData]) => (
            <React.Fragment key={employeeName}>
              {employeeData.map((data, index) =>
                renderTableRow(data, index, employeeName, employeeData.length)
              )}
              <tr className="bg-gray-200 font-bold">
                <td className="border border-gray-300 p-2" colSpan={2}>
                  Subtotal
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {employeeData
                    .reduce((sum, data) => sum + (data.hoursWorked || 0), 0)
                    .toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {employeeData.reduce(
                    (sum, data) => sum + (data.piecesCompleted || 0),
                    0
                  )}
                </td>
                <td className="border border-gray-300 p-2" colSpan={3}></td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductivityByEmployeeReport;
