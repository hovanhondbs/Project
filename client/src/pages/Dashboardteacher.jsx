import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e) => setSearchTerm(e.target.value);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate('/search', { state: { query: searchTerm } });
    }
  };

  // Hàm định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    const fetchData = async () => {
      const storedUserId = localStorage.getItem("userId");
      if (!storedUserId) {
        setLoading(false);
        return;
      }

      try {
        const [userRes, recentRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/user/${storedUserId}`),
          axios.get(`http://localhost:5000/api/user/${storedUserId}/recents`)
        ]);

        const processedSets = recentRes.data
          .filter(item => item.setId && typeof item.setId === 'object')
          .map(item => ({
            ...item.setId,
            userId: item.setId.userId || { username: userRes.data.username || 'You' },
            lastViewed: item.lastViewed,
            createdAt: item.setId.createdAt || new Date()
          }));

        setUserData(userRes.data);
        setRecentSets(processedSets);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
      const handleClickOutside = (e) => {
        if (avatarRef.current && !avatarRef.current.contains(e.target)) {
          setDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <SearchInput
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search flashcards or classes..."
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

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          
          {recentSets.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <p className="text-gray-500 mb-4">No recent teaching activities</p>
              <Link 
                to="/create-class" 
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create New Class
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSets.map((set) => {
                const creatorName = set.userId?.username || 'You';
                const creatorInitial = creatorName.charAt(0).toUpperCase();
                
                return (
                  <div
                    key={set._id}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-blue-400 transition-all duration-300"
                  >
                    <Link to={`/flashcards/${set._id}`} className="block">
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {set.cards?.length || 0} Terms
                        </span>
                        <div className="flex items-center">
                          {set.userId?.avatar ? (
                            <img 
                              src={set.userId.avatar} 
                              alt={creatorName}
                              className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-xs">
                              {creatorInitial}
                            </div>
                          )}
                          <span className="text-gray-700 truncate max-w-[100px]">
                            {creatorName}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-blue-700 truncate mb-1">{set.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-3">
                        {set.description || 'No description provided'}
                      </p>
                    </Link>
                    
                    {/* Hiển thị ngày tạo và ngày xem */}
                    {/* Phần hiển thị ngày tháng - chỉnh sửa đoạn này */}
                    <div className="flex justify-between text-xs text-gray-400 border-t pt-2">
                      <div>
                        <span className="block">Created: {formatDate(set.createdAt)}</span>
                          {set.lastViewed && (
                        <span className="block">Viewed: {formatDate(set.lastViewed)}</span>
                      )}
                    </div>
                      <Link 
                    to={`/flashcards/${set._id}`} 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
    Study Now →
  </Link>
</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboardteacher;