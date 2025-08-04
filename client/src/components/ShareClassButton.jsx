import React, { useState } from 'react';
import { FiShare2 } from 'react-icons/fi';

function ShareClassButton({ classId }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(classId)
      .then(() => setCopied(true))
      .catch(() => alert('Failed to copy'));
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="border border-gray-400 text-gray-700 rounded p-2 hover:bg-gray-100"
        title="Share class"
      >
        <FiShare2 />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-80">
            <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded mb-3">
              <span className="truncate">{classId}</span>
              <button
                onClick={handleCopy}
                className="text-sm text-blue-600  ml-2"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setCopied(false);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ShareClassButton;
