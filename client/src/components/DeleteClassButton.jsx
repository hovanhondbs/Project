import React, { useState } from 'react';
import axios from 'axios';
import { FiTrash } from 'react-icons/fi';

function DeleteClassButton({ classId, onDeleteSuccess }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`http://localhost:5000/api/classrooms/${classId}`);
      setShowConfirm(false);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete class");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="border border-red-500 p-2 rounded text-red-600 hover:bg-red-50"
        title="Delete class"
      >
        <FiTrash size={18} />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 shadow-md w-[320px]">
            <h2 className="text-lg font-semibold mb-4 text-red-700">Delete Class</h2>
            <p className="mb-6 text-gray-700">Do you want to delete this class?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeleteClassButton;
