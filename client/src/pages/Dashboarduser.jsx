import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaBell, FaSearch, FaCog, FaTrophy,
  FaSignOutAlt, FaHome, FaBook, FaRegClone
} from 'react-icons/fa';
import avatarImage from '../assets/icon/20250730_2254_image.png';
import axios from 'axios';

function Dashboarduser() {
  const location = useLocation();
  const navigate = useNavigate();
  const avatarRef = useRef();

  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentSets, setRecentSets] = useState([]);

  // Load user info
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      console.warn("userId is missing in localStorage");
      setLoading(false);
      return;
    }

    axios.get(`http://localhost:5000/api/user/${storedUserId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error("Lỗi lấy user info:", err))
      .finally(() => setLoading(false));
  }, []);

  // Load recent flashcard sets
  // ✅ Load recent flashcard sets từ MongoDB
useEffect(() => {
  const storedUserId = localStorage.getItem("userId");
  if (!storedUserId) return;

  axios.get(`http://localhost:5000/api/user/${storedUserId}/recents`)
    .then((res) => {
      console.log("Recents từ server:", res.data); // 👀 kiểm tra dữ liệu

      // Lọc bỏ item nếu setId bị null (trường hợp flashcard đã bị xoá)
      const sets = res.data
        .filter(item => item.setId && typeof item.setId === 'object')
        .map(item => item.setId);

      setRecentSets(sets);
    })
    .catch((err) => {
      console.error("Lỗi khi tải recent từ DB:", err);
    });
}, []);

  // Handle click outside avatar dropdown
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-white p-4">
        <h1 className="text-blue-600 text-2xl font-bold mb-8">FlashCard</h1>
        <nav className="space-y-1 text-gray-700">
          <Link to="/dashboard-user" className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${location.pathname === '/dashboard-user' ? 'bg-blue-100 text-blue-600' : 'hover:bg-blue-50 hover:text-blue-600'}`}>
            <div className={`p-2 rounded-full ${location.pathname === '/dashboard-user' ? 'bg-blue-600 text-white' : ''}`}>
              <FaHome />
            </div>
            Home
          </Link>
          <Link to="/library" className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${location.pathname === '/library' ? 'bg-[#08D9AA] text-white' : 'hover:bg-[#08D9AA]/20 hover:text-[#08D9AA]'}`}>
            <div className={`p-2 rounded-full ${location.pathname === '/library' ? 'bg-white text-[#08D9AA]' : ''}`}>
              <FaBook />
            </div>
            Your Library
          </Link>
          <Link to="/flashcards" className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${location.pathname === '/flashcards' ? 'bg-[#8731EB] text-white' : 'hover:bg-[#8731EB]/20 hover:text-[#8731EB]'}`}>
            <div className={`p-2 rounded-full ${location.pathname === '/flashcards' ? 'bg-white text-[#8731EB]' : ''}`}>
              <FaRegClone />
            </div>
            Flashcards
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6 relative">
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Search for study guides" className="w-full px-10 py-2 border rounded-2xl shadow-sm" />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center gap-4 ml-4 relative">
            <FaBell className="text-xl text-gray-500 hover:text-blue-600 cursor-pointer" />
            <div className="relative" ref={avatarRef}>
              <img
                src={userData?.avatar || avatarImage}
                alt="User avatar"
                className="w-14 h-14 rounded-full border-2 border-gray-300 cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                  <div className="px-4 py-3 border-b">
                    {loading ? (
                      <p className="text-sm text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="font-semibold text-sm">{userData?.username}</p>
                        <p className="text-xs text-gray-500">{userData?.email}</p>
                      </>
                    )}
                  </div>
                  <ul className="text-sm text-gray-700">
                    <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"><FaTrophy /> Achievements</li>
                    <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"><FaCog /> Settings</li>
                    <li onClick={handleLogout} className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"><FaSignOutAlt /> Log out</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recents */}
        <h2 className="text-xl font-semibold mb-4">Recents</h2>
        {recentSets.length === 0 ? (
          <p className="text-gray-500">No recent flashcard sets.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSets.map((set) => (
              <Link
                key={set._id}
                to={`/flashcards/${set._id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-blue-400 transition-all duration-300"
              >
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{set.cards?.length || 0} Terms</span>
                  <span>{userData?.username || 'You'}</span>
                </div>
                <h3 className="text-xl font-semibold text-blue-700 truncate">{set.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{set.description}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboarduser;
