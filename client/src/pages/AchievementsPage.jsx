import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import UserMenu from '../components/UserMenu';
import treeImg from '../assets/image/tree.png';

function AchievementsPage({
  avatarRef,
  dropdownOpen,
  setDropdownOpen,
  userData,
  loading,
  handleLogout,
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [fireDays, setFireDays] = useState([]); // dạng YYYY-MM-DD
  const [streak, setStreak] = useState(0);

  const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    axios.get('http://localhost:5000/api/activity', {
      params: { userId }
    })
    .then((res) => {
      setFireDays(res.data.fireDays || []);
      setStreak(res.data.streak || 0);
    })
    .catch((err) => console.error('Lỗi lấy hoạt động:', err));
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const generateCalendar = () => {
    const startDay = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const rows = [];
    let day = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < startDay) || day > totalDays) {
          week.push(<td key={j}></td>);
        } else {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isFire = fireDays.includes(dateStr);

          week.push(
            <td key={j} className="text-center py-1">
              <div className={`w-8 h-8 rounded-full mx-auto ${isFire ? 'bg-orange-100' : ''}`}>
                {isFire ? <span className="text-orange-500 text-xl">🔥</span> : <span>{day}</span>}
              </div>
            </td>
          );
          day++;
        }
      }
      rows.push(<tr key={i}>{week}</tr>);
    }
    return rows;
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <SearchInput />
          <UserMenu
            avatarRef={avatarRef}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            userData={userData}
            loading={loading}
            handleLogout={handleLogout}
          />
        </div>

        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>

        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12">
          {/* Calendar */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={handlePrevMonth} className="text-gray-500 hover:text-gray-800 text-xl">←</button>
              <h4 className="text-sm font-bold uppercase text-gray-800">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h4>
              <button onClick={handleNextMonth} className="text-gray-500 hover:text-gray-800 text-xl">→</button>
            </div>

            <table className="text-sm text-gray-800">
              <thead>
                <tr className="text-[#2563EB] font-semibold">
                  <th className="px-2">S</th>
                  <th className="px-2">M</th>
                  <th className="px-2">T</th>
                  <th className="px-2">W</th>
                  <th className="px-2">T</th>
                  <th className="px-2">F</th>
                  <th className="px-2">S</th>
                </tr>
              </thead>
              <tbody>{generateCalendar()}</tbody>
            </table>
          </div>

          {/* Streak + Tree */}
          <div className="flex flex-col items-center text-center gap-2">
            <p className="text-sm text-gray-500">Current streak</p>
            <strong className="text-4xl text-blue-600">{streak} days</strong>
            <img src={treeImg} alt="Tree" className="w-32 h-auto mt-2" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AchievementsPage;
