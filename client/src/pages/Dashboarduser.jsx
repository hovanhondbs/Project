import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaCog, FaTrophy, FaSignOutAlt, FaHome, FaBook, FaRegClone } from 'react-icons/fa';
import avatarImage from '../assets/icon/20250730_2254_image.png';
import axios from 'axios';

function Dashboarduser() {
  const location = useLocation();
  const navigate = useNavigate();
  const avatarRef = useRef();

  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Đóng dropdown khi click ra ngoài
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

  // Lấy thông tin người dùng
  useEffect(() => {
  const storedUserId = localStorage.getItem("userId");
  
  if (!storedUserId) {
    console.warn("userId is missing in localStorage");
    setLoading(false);
    return;
  }

  axios.get(`http://localhost:5000/api/user/${storedUserId}`)
    .then((res) => setUserData(res.data))
    .catch((err) => console.error("Lỗi lấy user info:", err))
    .finally(() => setLoading(false));
}, []); // ✅ giữ nguyên dependency array là [] để không gây lỗi



  // Xử lý đăng xuất
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
            <input
              type="text"
              placeholder="Search for study guides"
              className="w-full px-10 py-2 border rounded-2xl shadow-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center gap-4 ml-4 relative">
            <FaBell className="text-xl text-gray-500 hover:text-blue-600 cursor-pointer" />
            {/* Avatar */}
            <div className="relative" ref={avatarRef}>
              <img
                src={userData?.avatar || avatarImage}
                alt="User avatar"
                className="w-14 h-14 rounded-full border-2 border-gray-300 cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                  <div className="px-4 py-3 border-b">
                    {loading ? (
                      <p className="text-sm text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="font-semibold text-sm">{userData?.username || "Username"}</p>
                        <p className="text-xs text-gray-500">{userData?.email || "email@example.com"}</p>
                      </>
                    )}
                  </div>
                  <ul className="text-sm text-gray-700">
                    <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                      <FaTrophy /> Achievements
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                      <FaCog /> Settings
                    </li>
                    <li onClick={handleLogout} className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                      <FaSignOutAlt /> Log out
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Recents</h2>
        <div className="bg-white p-4 rounded shadow text-gray-600">
          <p>Untitled flashcard set</p>
          <span className="text-sm text-gray-400">Draft · by you</span>
        </div>
      </main>
    </div>
  );
}

export default Dashboarduser;
