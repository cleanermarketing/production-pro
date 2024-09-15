import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface TimeclockEntry {
  _id: string;
  userId: string;
  jobTypeId: string;
  startTime: Date;
  endTime: Date | null;
}

interface JobType {
  _id: string;
  name: string;
  paid: boolean;
}

interface EditTimeclockModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Array<{
    entry: TimeclockEntry;
    jobType: JobType;
  }>;
  onSave: (
    updatedEntries: Array<{ entry: TimeclockEntry; jobType: JobType }>
  ) => void;
  allJobTypes: JobType[];
}

const EditTimeclockModal: React.FC<EditTimeclockModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSave,
  allJobTypes,
}) => {
  const [editedEntries, setEditedEntries] = useState(entries);

  useEffect(() => {
    setEditedEntries(entries);
  }, [entries]);

  const handleInputChange = (
    index: number,
    field: keyof TimeclockEntry | "jobTypeId",
    value: any
  ) => {
    const updatedEntries = [...editedEntries];
    if (field === "jobTypeId") {
      const newJobType = allJobTypes.find((jt) => jt._id === value);
      updatedEntries[index] = {
        ...updatedEntries[index],
        entry: { ...updatedEntries[index].entry, jobTypeId: value },
        jobType: newJobType || updatedEntries[index].jobType,
      };
    } else {
      updatedEntries[index] = {
        ...updatedEntries[index],
        entry: { ...updatedEntries[index].entry, [field]: value },
      };
    }
    setEditedEntries(updatedEntries);
  };

  const handleSave = () => {
    onSave(editedEntries);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Edit Timeclock Entries
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Clock In
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Clock Out
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Job
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Paid
                </th>
              </tr>
            </thead>
            <tbody>
              {editedEntries.map((entry, index) => (
                <tr key={entry.entry._id}>
                  <td className="border border-gray-300 px-4 py-2">
                    <DatePicker
                      selected={new Date(entry.entry.startTime)}
                      onChange={(date) =>
                        handleInputChange(index, "startTime", date)
                      }
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={1}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      timeFormat="h:mm aa"
                      className="border rounded p-1 w-full"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <DatePicker
                      selected={
                        entry.entry.endTime
                          ? new Date(entry.entry.endTime)
                          : null
                      }
                      onChange={(date) =>
                        handleInputChange(index, "endTime", date)
                      }
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={1}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      timeFormat="h:mm aa"
                      className="border rounded p-1 w-full"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <select
                      value={entry.entry.jobTypeId}
                      onChange={(e) =>
                        handleInputChange(index, "jobTypeId", e.target.value)
                      }
                      className="border rounded p-1 w-full"
                    >
                      {allJobTypes.map((jobType) => (
                        <option key={jobType._id} value={jobType._id}>
                          {jobType.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {entry.jobType.paid ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-black px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTimeclockModal;
