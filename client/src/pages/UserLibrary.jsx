import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';

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

  // ✅ Lấy danh sách lớp
  useEffect(() => {
    if (userData?.role === 'Teacher') {
      axios.get(`http://localhost:5000/api/classrooms/by-user/${storedUserId}`)
        .then(res => setClasses(res.data))
        .catch(err => console.error("Lỗi lấy danh sách lớp:", err));
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
            <div className="mr-6 pb-2 text-gray-400 cursor-not-allowed">Practice tests</div>

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
          </div>

          {/* Flashcards */}
          {activeTab === "flashcards" && (
            <>
              {flashcardSets.length === 0 ? (
                <p className="text-gray-500">No flashcard sets yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flashcardSets.map((set) => (
                    <Link
                      key={set._id}
                      to={`/flashcards/${set._id}`}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-blue-400 transition-all duration-300"
                    >
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{set.cards?.length || 0} Terms</span>
                        <span>{userData?.username || "You"}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-blue-700 truncate">{set.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{set.description}</p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Classes */}
          {activeTab === "classes" && userData?.role === 'Teacher' && (
            <>
              {classes.length === 0 ? (
                <p className="text-gray-500">You haven't created any classes yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map(cls => (
                    <Link
                      to={`/classes/${cls._id}`}
                      key={cls._id}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-green-700 transition-all duration-300 block"
                    >
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{cls.students?.length || 0} students</span>
                        <span>{userData?.username}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-green-700 truncate">{cls.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cls.description}</p>
                    </Link>
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
