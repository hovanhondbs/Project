import React, { useState } from 'react';
import { FaBolt, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function GoalSelection() {
  const [selectedGoal, setSelectedGoal] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    if (!selectedGoal) {
      alert("Please select a goal before continuing.");
      return;
    }

    // Chuyển đến trang học
    navigate(`/learn?goal=${selectedGoal}`);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-[600px] bg-white rounded-2xl p-8 shadow-xl border">
        <h2 className="text-sm text-gray-500 font-semibold">Topic</h2>
        <h1 className="text-2xl font-bold mb-6">Choose a goal for this session</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setSelectedGoal('cram')}
            className={`border rounded-xl p-4 flex items-center justify-between ${
              selectedGoal === 'cram' ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'
            }`}
          >
            <span className="text-left">
              <span className="block font-semibold">Cram for a test</span>
            </span>
            <FaBolt className="text-yellow-500 text-xl" />
          </button>

          <button
            onClick={() => setSelectedGoal('memorize')}
            className={`border rounded-xl p-4 flex items-center justify-between ${
              selectedGoal === 'memorize' ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'
            }`}
          >
            <span className="text-left">
              <span className="block font-semibold">Memorize it all</span>
            </span>
            <FaFileAlt className="text-blue-500 text-xl" />
          </button>
        </div>

        <div className="text-right">
          <button
            onClick={handleStart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold shadow"
          >
            Start Learn →
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalSelection;
