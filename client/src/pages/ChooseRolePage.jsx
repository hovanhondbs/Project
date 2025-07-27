import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ChooseRolePage() {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      alert('You are not logged in!');
      navigate('/login');
      return;
    }

    if (!day || !month || !year || !role) {
      alert('Please complete all fields.');
      return;
    }

    const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    try {
      await axios.put(
        'http://localhost:5000/api/auth/update-role',
        { dob, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(role === 'User' ? '/user' : '/teacher');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const generateOptions = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pb-40">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow max-w-md w-full space-y-6"
      >
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Complete your profile
        </h2>

        {/* Birthday Dropdown */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Date of Birth
          </label>
          <div className="flex gap-2">
            <select
              className="w-1/3 px-3 py-2 border rounded bg-gray-50"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              required
            >
              <option value="">Day</option>
              {generateOptions(1, 31).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              className="w-1/3 px-3 py-2 border rounded bg-gray-50"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            >
              <option value="">Month</option>
              {generateOptions(1, 12).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              className="w-1/3 px-3 py-2 border rounded bg-gray-50"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            >
              <option value="">Year</option>
              {generateOptions(1970, new Date().getFullYear()).reverse().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Role Radio Group */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Choose Role
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="User"
                checked={role === 'User'}
                onChange={(e) => setRole(e.target.value)}
              />
              <span>User</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="Teacher"
                checked={role === 'Teacher'}
                onChange={(e) => setRole(e.target.value)}
              />
              <span>Teacher</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          OK
        </button>
      </form>
    </div>
  );
}

export default ChooseRolePage;
