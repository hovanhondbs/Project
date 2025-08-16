import React, { useState, useEffect } from 'react';
import { FiEdit } from 'react-icons/fi';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function EditClassButton({ classData, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classData) {
      setName(classData.name || '');
      setDescription(classData.description || '');
    }
  }, [classData]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Class name is required');
      return;
    }
    setLoading(true);
    try {
      const requesterId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      const res = await axios.put(
        `${API}/api/classrooms/${classData._id}`,
        { name, description, requesterId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (onUpdate) onUpdate(res.data);
      setOpen(false);
    } catch (err) {
      console.error('Error updating class:', err);
      alert(err?.response?.data?.error || 'Failed to update class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded hover:bg-blue-100 text-blue-600 border border-blue-600"
        title="Edit Class"
      >
        <FiEdit size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-md">
            <h2 className="text-xl font-semibold mb-4">Edit Class</h2>

            <label className="block text-sm mb-1 font-medium">Class Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
              placeholder="Enter class name"
            />

            <label className="block text-sm mb-1 font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
              rows={4}
              placeholder="Enter description"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-gray-600 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EditClassButton;
