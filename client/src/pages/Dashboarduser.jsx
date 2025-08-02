import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';


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
      <Sidebar />
      {/* Main content */}
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
