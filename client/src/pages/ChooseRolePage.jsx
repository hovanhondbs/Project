import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';

function ChooseRolePage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [errors, setErrors] = useState({
    day: false,
    month: false,
    year: false,
    role: false,
  });

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const handleSubmit = async () => {
    const newErrors = {
      day: !day,
      month: !month,
      year: !year,
      role: !selectedRole,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const userId = localStorage.getItem('userId');

    try {
      await axios.put(`http://localhost:5000/api/user/${userId}/dob`, { dob });
      localStorage.setItem('userRole', selectedRole);
      navigate(selectedRole === 'User' ? '/dashboard-user' : '/dashboard-teacher');
    } catch (err) {
      console.error('Error updating DOB:', err);
      alert('Failed to save birth date.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Personal Information</h2>

        {/* Date of Birth */}
        <div className="flex justify-center gap-4 mb-6">
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={`border px-3 py-2 rounded ${errors.day ? 'border-red-500' : ''}`}
          >
            <option value="">Day</option>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={`border px-3 py-2 rounded ${errors.month ? 'border-red-500' : ''}`}
          >
            <option value="">Month</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={`border px-3 py-2 rounded ${errors.year ? 'border-red-500' : ''}`}
          >
            <option value="">Year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Role selection */}
        <h3 className="text-lg font-semibold mb-4">Choose your role</h3>
        <div className="flex justify-center gap-6 mb-6">
          <button
            className={`border rounded-xl p-4 w-32 flex flex-col items-center justify-center gap-2 ${
              selectedRole === 'User'
                ? 'border-blue-600 bg-blue-50'
                : errors.role
                ? 'border-red-500'
                : 'hover:border-blue-300'
            }`}
            onClick={() => setSelectedRole('User')}
          >
            <FaUserGraduate className="text-3xl text-blue-500" />
            <span className="font-semibold">Student</span>
          </button>

          <button
            className={`border rounded-xl p-4 w-32 flex flex-col items-center justify-center gap-2 ${
              selectedRole === 'Teacher'
                ? 'border-blue-600 bg-blue-50'
                : errors.role
                ? 'border-red-500'
                : 'hover:border-blue-300'
            }`}
            onClick={() => setSelectedRole('Teacher')}
          >
            <FaChalkboardTeacher className="text-3xl text-green-600" />
            <span className="font-semibold">Teacher</span>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition"
        >
          OK →
        </button>
      </div>
    </div>
  );
}

export default ChooseRolePage;
