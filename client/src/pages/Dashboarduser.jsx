import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// helper chung
const absDash = (src) => {
  if (!src) return '';
  let s = String(src).replace(/\\/g, '/').trim();
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  if (/^\/?uploads\//i.test(s)) return `${API_BASE}/${s.replace(/^\/+/, '')}`;
  if (/^\/(static|assets)\//i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, '')}`;
};

function Dashboarduser() {
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

  useEffect(() => {
    const fetchData = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        setLoading(false);
        return;
      }
      try {
        const [userRes, recentRes] = await Promise.all([
          axios.get(`${API_BASE}/api/user/${storedUserId}`),
          axios.get(`${API_BASE}/api/user/${storedUserId}/recents`),
        ]);

        const processed = (recentRes.data || [])
          .filter((it) => it.setId && typeof it.setId === 'object')
          .map((it) => ({
            ...it.setId,
            userId: it.setId.userId || { username: 'Unknown', avatar: '' },
            lastViewed: it.lastViewed,
            createdAt: it.setId.createdAt || new Date(),
          }));

        setUserData(userRes.data);
        setRecentSets(processed);
      } catch (err) {
        console.error('Error fetching data:', err);
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
            onProfileUpdated={(u) => setUserData(u)}
          />
        </div>

        <h2 className="text-xl font-semibold mb-4">Recent Study Sets</h2>

        {recentSets.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <p className="text-gray-500 mb-4">You haven't studied any sets recently</p>
            <Link to="/flashcards" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Create New Set
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSets.map((set) => {
              const creatorName = set.userId?.username || 'Unknown';
              const creatorInitial = creatorName.charAt(0).toUpperCase();
              const creatorAvatar = absDash(set.userId?.avatar || '');

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
                        {creatorAvatar ? (
                          <img
                            src={creatorAvatar}
                            alt={creatorName}
                            className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-200"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-xs">
                            {creatorInitial}
                          </div>
                        )}
                        <span className="text-gray-700 truncate max-w-[100px]">{creatorName}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-blue-700 truncate mb-1">{set.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-3">
                      {set.description || 'No description provided'}
                    </p>
                  </Link>

                  <div className="flex justify-between text-xs text-gray-400 border-t pt-2">
                    <div>
                      <span className="block">Created: {formatDate(set.createdAt)}</span>
                      {set.lastViewed && <span className="block">Viewed: {formatDate(set.lastViewed)}</span>}
                    </div>
                    <Link to={`/flashcards/${set._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Study Now →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboarduser;
