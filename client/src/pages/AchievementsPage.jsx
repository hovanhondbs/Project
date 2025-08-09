import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import UserMenu from '../components/UserMenu';
import treeImg from '../assets/image/tree.png';

function AchievementsPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [fireDays, setFireDays] = useState([]); // dạng YYYY-MM-DD
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const avatarRef = useRef();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
    
  const handleInputChange = (e) => setSearchTerm(e.target.value);
  
  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      if (!searchTerm.trim()) return;
      navigate('/search', { state: { query: searchTerm } });
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // Lấy dữ liệu hoạt động
    axios.get('http://localhost:5000/api/activity', {
      params: { userId }
    })
    .then((res) => {
      setFireDays(res.data.fireDays || []);
      setStreak(res.data.currentStreak || 0);
      setLongestStreak(res.data.longestStreak || 0);
    })
    .catch((err) => console.error('Lỗi lấy hoạt động:', err));

    // Lấy thông tin user
    axios.get(`http://localhost:5000/api/user/${userId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error("Lỗi lấy thông tin user:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
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
          week.push(<td key={`empty-${i}-${j}`} className="py-1"></td>);
        } else {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isFire = fireDays.includes(dateStr);
          const isToday = (
            today.getDate() === day && 
            today.getMonth() === currentMonth && 
            today.getFullYear() === currentYear
          );

          week.push(
            <td key={`day-${day}`} className="text-center py-1">
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center 
                ${isToday ? 'border-2 border-blue-500' : ''}`}>
                {isFire ? (
                  <span className="text-orange-500 text-xl">🔥</span>
                ) : (
                  <span className={isToday ? 'font-bold text-blue-500' : ''}>{day}</span>
                )}
              </div>
            </td>
          );
          day++;
        }
      }
      rows.push(<tr key={`week-${i}`}>{week}</tr>);
    }
    return rows;
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <SearchInput
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <UserMenu
            avatarRef={avatarRef}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            userData={userData}
            loading={loading}
            handleLogout={handleLogout}
          />
        </div>

        <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>

        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-center items-start gap-8 md:gap-12">
          {/* Calendar */}
          <div className="flex flex-col items-center w-full md:w-auto">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={handlePrevMonth} 
                className="text-gray-500 hover:text-gray-800 text-xl p-1"
              >
                ←
              </button>
              <h4 className="text-lg font-bold text-gray-800">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h4>
              <button 
                onClick={handleNextMonth} 
                className="text-gray-500 hover:text-gray-800 text-xl p-1"
              >
                →
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-blue-600 font-semibold">
                  {DAY_NAMES.map((day, index) => (
                    <th key={day} className="py-2 px-1 text-sm">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{generateCalendar()}</tbody>
            </table>
          </div>

          {/* Streak Stats */}
          <div className="flex flex-col items-center w-full md:w-auto gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Current streak</p>
              <strong className="text-4xl text-blue-600">{streak} days</strong>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Longest streak</p>
              <strong className="text-2xl text-gray-700">{longestStreak} days</strong>
            </div>
            
            <img 
              src={treeImg} 
              alt="Tree" 
              className="w-32 h-auto mt-2" 
              style={{ filter: `grayscale(${100 - Math.min(streak, 5)*20}%)` }} 
            />
            
            <p className="text-sm text-gray-500 mt-2">
              {streak > 0 ? `Keep it up! 🔥` : `Start learning to begin your streak!`}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AchievementsPage;