import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
// Chuẩn hoá URL avatar (xử lý http(s), blob, /uploads, uploads, assets…)
const abs = (src) => {
  if (!src) return '';
  let s = String(src).replace(/\\/g, '/').trim();
 if (/^(https?:|blob:|data:)/i.test(s)) return s;
  if (/^\/?uploads\//i.test(s)) return `${API_BASE}/${s.replace(/^\/+/, '')}`;
  if (/^\/(static|assets)\//i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, '')}`;
};

function UserLibrary() {
  const navigate = useNavigate();
  const avatarRef = useRef();

  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState("flashcards");

  const storedUserId = localStorage.getItem("userId");

  const [searchTerm, setSearchTerm] = useState('');
  const handleInputChange = (e) => setSearchTerm(e.target.value);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate('/search', { state: { query: searchTerm } });
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Lấy user info
  useEffect(() => {
    if (!storedUserId) {
      console.warn("userId is missing in localStorage");
      setLoading(false);
      return;
    }

    axios.get(`http://localhost:5000/api/user/${storedUserId}`)
      .then((res) => setUserData(res.data))
      .catch((err) => console.error("Lỗi lấy user info:", err))
      .finally(() => setLoading(false));
  }, [storedUserId]);

  // Lấy flashcard sets
  useEffect(() => {
    if (!storedUserId) return;
    axios.get(`http://localhost:5000/api/flashcards/user/${storedUserId}`)
      .then(res => setFlashcardSets(res.data))
      .catch(err => console.error('Failed to fetch flashcard sets:', err));
  }, [storedUserId]);

  // Lấy danh sách lớp nếu là Teacher
  useEffect(() => {
    if (userData?.role === 'Teacher') {
      axios.get(`http://localhost:5000/api/classrooms/by-user/${storedUserId}`)
        .then(res => setClasses(res.data))
        .catch(err => console.error("Lỗi lấy danh sách lớp:", err));
    }
  }, [userData, storedUserId]);

  // Lấy lớp của User đã tham gia
  useEffect(() => {
    if (userData?.role === 'User') {
      axios.get(`http://localhost:5000/api/classrooms/joined/${storedUserId}`)
        .then(res => setClasses(res.data))
        .catch(err => console.error("Lỗi lấy lớp đã tham gia:", err));
    }
  }, [userData, storedUserId]);

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

  // Function to get avatar initials
  const getAvatarInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Content */}
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Your Library</h2>

          {/* Tabs */}
          <div className="flex border-b border-gray-300 mb-4">
            <div
              className={`mr-6 pb-2 cursor-pointer ${
                activeTab === "flashcards"
                  ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("flashcards")}
            >
              Flashcard sets
            </div>

            {userData?.role === 'Teacher' && (
              <div
                className={`mr-6 pb-2 cursor-pointer ${
                  activeTab === "classes"
                    ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("classes")}
              >
                Classes
              </div>
            )}

            {userData?.role === 'User' && (
              <div
                className={`mr-6 pb-2 cursor-pointer ${
                  activeTab === "my-classes"
                    ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("my-classes")}
              >
                My Classes
              </div>
            )}
          </div>

          {/* Flashcards */}
          {activeTab === "flashcards" && (
            <>
              {flashcardSets.length === 0 ? (
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <p className="text-gray-500 mb-4">You haven't created any flashcard sets yet</p>
                  <Link 
                    to="/flashcards" 
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create New Set
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flashcardSets.map((set) => (
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
                            
                            {(() => {
                              const name = set.userId?.username || userData?.username || 'You';
                              const url  = abs(set.userId?.avatar || userData?.avatar || '');
                              const initials = getAvatarInitials(name);
                              return url ? (
                                <img
                                  src={url}
                                  alt={name}
                                 className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-200"
                                  onError={(e)=>{ e.currentTarget.style.display='none'; }}
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                                  {initials}
                                </div>
                              );
                            })()}
                            <span>{set.userId?.username || userData?.username || "You"}</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-blue-700 truncate mb-1">{set.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-3">
                          {set.description || 'No description provided'}
                        </p>
                      </Link>
                      
                      {/* Date information */}
                      <div className="flex justify-between text-xs text-gray-400 border-t pt-2">
                        <div>
                          <span className="block">Created: {formatDate(set.createdAt)}</span>
                          {set.lastViewed && <span className="block">Viewed: {formatDate(set.lastViewed)}</span>}
                        </div>
                        <Link 
                          to={`/flashcards/${set._id}`} 
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Study Now →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Classes for Teacher */}
          {activeTab === "classes" && userData?.role === 'Teacher' && (
            <>
              {classes.length === 0 ? (
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <p className="text-gray-500 mb-4">You haven't created any classes yet</p>
                  <Link 
                    to="/create-class" 
                    className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create New Class
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map(cls => (
                    <div
                      key={cls._id}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-green-700 transition-all duration-300"
                    >
                      <Link to={`/classes/${cls._id}`} className="block">
                        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {cls.students?.length || 0} students
                          </span>
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs mr-2">
                              {getAvatarInitials(userData?.username)}
                            </div>
                            <span>{userData?.username}</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-green-700 truncate mb-1">{cls.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-3">
                          {cls.description || 'No description provided'}
                        </p>
                      </Link>
                      
                      {/* Date information */}
                      <div className="flex justify-between text-xs text-gray-400 border-t pt-2">
                        <div>
                          <span className="block">Created: {formatDate(cls.createdAt)}</span>
                          {cls.lastAccessed && <span className="block">Accessed: {formatDate(cls.lastAccessed)}</span>}
                        </div>
                        <Link 
                          to={`/classes/${cls._id}`} 
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Open Class →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* My Classes for User */}
          {activeTab === "my-classes" && userData?.role === 'User' && (
            <>
              {classes.length === 0 ? (
                <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <p className="text-gray-500 mb-4">You haven't joined any classes yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map(cls => (
                    <div
                      key={cls._id}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-green-700 transition-all duration-300"
                    >
                      <Link to={`/classes/${cls._id}`} className="block">
                        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {cls.students?.length || 0} students
                          </span>
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs mr-2">
                              {getAvatarInitials(cls.createdBy?.username || "Teacher")}
                            </div>
                            <span>{cls.createdBy?.username || "Teacher"}</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-green-700 truncate mb-1">{cls.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-3">
                          {cls.description || 'No description provided'}
                        </p>
                      </Link>
                      
                      {/* Date information */}
                      <div className="flex justify-between text-xs text-gray-400 border-t pt-2">
                        <div>
                          <span className="block">Created: {formatDate(cls.createdAt)}</span>
                          {cls.lastAccessed && <span className="block">Accessed: {formatDate(cls.lastAccessed)}</span>}
                        </div>
                        <Link 
                          to={`/classes/${cls._id}`} 
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Open Class →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default UserLibrary;