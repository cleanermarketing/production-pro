import React, { useState } from "react";

interface ClockOutReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  className?: string;
}

const clockOutReasons = [
  "End Shift",
  "Change Jobs",
  "Break",
  "Ran Out Of Pieces",
];

const ClockOutReasonModal: React.FC<ClockOutReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  className,
}) => {
  const [selectedReason, setSelectedReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason);
    }
  };

  return (
    <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center ${className}`}>
      <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Clock Out Reason
        </h3>
        <select
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="">Select a reason</option>
          {clockOutReasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={!selectedReason}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
          >
            Clock Out
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

export default ClockOutReasonModal;
