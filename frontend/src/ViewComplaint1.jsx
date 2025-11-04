import React from "react";
import { X } from "lucide-react";

const ComplaintModal = ({ isOpen, onClose, complaint }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={22} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold text-green-800 mb-4">
          Complaint Details
        </h2>

        {/* Complaint Info */}
        <div className="space-y-3 text-gray-700">
          <p>
            <span className="font-semibold">Issue Title:</span>{" "}
            {complaint?.title || "Streetlight not working"}
          </p>
          <p>
            <span className="font-semibold">Description:</span>{" "}
            {complaint?.description ||
              "The streetlight near Sector 2 park has been non-functional for 3 days."}
          </p>
          <p>
            <span className="font-semibold">Location:</span>{" "}
            {complaint?.location || "Sector 2, Bhubaneswar"}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={`px-2 py-1 rounded-lg text-sm ${
                complaint?.status === "Resolved"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {complaint?.status || "In Review"}
            </span>
          </p>
          <p>
            <span className="font-semibold">Reported By:</span>{" "}
            {complaint?.reporter || "Ameenunnisa Khan"}
          </p>
          <p>
            <span className="font-semibold">Date:</span>{" "}
            {complaint?.date || "20 Oct 2025"}
          </p>
        </div>

        {/* Optional Image */}
        {complaint?.image && (
          <div className="mt-4">
            <img
              src={complaint.image}
              alt="Issue"
              className="rounded-lg border border-gray-200"
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>
          <button className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800">
            Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintModal;
