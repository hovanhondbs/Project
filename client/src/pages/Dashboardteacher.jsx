import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';

function Dashboardteacher() {
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
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) return;

    axios.get(`http://localhost:5000/api/user/${storedUserId}/recents`)
      .then((res) => {
        const sets = res.data
          .filter(item => item.setId && typeof item.setId === 'object')
          .map(item => item.setId);

        setRecentSets(sets);
      })
      .catch((err) => {
        console.error("Lỗi khi tải recent từ DB:", err);
      });
  }, []);

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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Nội dung Dashboard dành cho giáo viên */}
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Welcome back, {userData?.username || "Teacher"}!</h2>
        <p className="text-gray-600 mb-6">Here are your recent flashcard sets and teaching activity.</p>

        {recentSets.length === 0 ? (
          <p className="text-gray-500">No recent flashcard sets found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSets.map((set) => (
              <div
                key={set._id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg transition"
              >
                <div className="text-sm text-gray-500 mb-2 flex justify-between">
                  <span>{set.cards?.length || 0} Terms</span>
                  <span>{userData?.username || "Teacher"}</span>
                </div>
                <h3 className="text-lg font-semibold text-blue-600 truncate">{set.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{set.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboardteacher;
