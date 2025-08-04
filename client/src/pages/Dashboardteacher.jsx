// ✅ Dashboardteacher.jsx (FULL - Enter để tìm kiếm)
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
  const [searchResults, setSearchResults] = useState(null);

  const handleInputChange = (e) => setSearchTerm(e.target.value);

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      if (!searchTerm.trim()) return setSearchResults(null);
      try {
        const res = await axios.get(`http://localhost:5000/api/search?query=${encodeURIComponent(searchTerm)}`);
        setSearchResults(res.data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults(null);
      }
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) return setLoading(false);

    axios.get(`http://localhost:5000/api/user/${storedUserId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error("Lỗi user:", err))
      .finally(() => setLoading(false));

    axios.get(`http://localhost:5000/api/user/${storedUserId}/recents`)
      .then((res) => {
        const sets = res.data.filter(item => item.setId && typeof item.setId === 'object').map(item => item.setId);
        setRecentSets(sets);
      })
      .catch((err) => console.error("Lỗi recent:", err));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <SearchInput value={searchTerm} onChange={handleInputChange} onKeyDown={handleKeyDown} />
          <UserMenu avatarRef={avatarRef} dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} userData={userData} loading={loading} handleLogout={handleLogout} />
        </div>

        {searchResults && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Search Results</h2>
            {searchResults.flashcards?.length > 0 && (
              <>
                <h3 className="text-lg font-medium text-blue-700">Flashcard Sets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {searchResults.flashcards.map((set) => (
                    <Link key={set._id} to={`/flashcards/${set._id}`} className="bg-white border rounded-xl p-5 shadow hover:border-blue-400">
                      <h4 className="text-md font-semibold text-blue-700 truncate">{set.title}</h4>
                      <p className="text-sm text-gray-500">{set.terms?.length || 0} terms</p>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {searchResults.classes?.length > 0 && (
              <>
                <h3 className="text-lg font-medium text-green-700">Classes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.classes.map((cls) => (
                    <Link key={cls._id} to={`/class/${cls._id}`} className="bg-white border rounded-xl p-5 shadow hover:border-green-400">
                      <h4 className="text-md font-semibold text-green-700 truncate">{cls.name}</h4>
                      <p className="text-sm text-gray-500">ID: {cls._id}</p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">Recents</h2>
        {recentSets.length === 0 ? (
          <p className="text-gray-500">No recent flashcard sets.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSets.map((set) => (
              <Link key={set._id} to={`/flashcards/${set._id}`} className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-blue-400 transition-all duration-300">
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

export default Dashboardteacher;
