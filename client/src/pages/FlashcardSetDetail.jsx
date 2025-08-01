// src/pages/FlashcardSetDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaBell, FaSearch, FaCog, FaTrophy, FaSignOutAlt, FaHome, FaBook, FaRegClone, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import avatarImage from '../assets/icon/20250730_2254_image.png';
import axios from 'axios';
import './FlashcardSetDetail.css';

function FlashcardSetDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const avatarRef = useRef();
  const { id } = useParams();

  const storedUserId = localStorage.getItem("userId");
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [set, setSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!storedUserId) return;
    axios.get(`http://localhost:5000/api/user/${storedUserId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error("Lỗi lấy user info:", err))
      .finally(() => setLoading(false));
  }, [storedUserId]);

  useEffect(() => {
    const fetchSet = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/flashcards/${id}`);
        setSet(res.data);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu chi tiết:', error);
      }
    };
    fetchSet();
  }, [id]);

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

  if (!set) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>;

  const currentCard = set.cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < set.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <div className="flex min-h-screen bg-gray-100">
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

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
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

        {/* Flashcard Viewer */}
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-2">{set.title}</h1>
          <p className="text-gray-600 mb-6">{set.description}</p>

          <div className="flashcard-viewer">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
              <FaArrowLeft />
            </button>

            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  <p className="text-xl font-bold">{currentCard.term}</p>
                  {currentCard.image && (
                    <img
                      src={`http://localhost:5000/${currentCard.image}`}
                      alt="term"
                      className="mt-4 w-full h-32 object-contain"
                    />
                  )}
                </div>
                <div className="flashcard-back">
                  <p className="text-lg text-center text-gray-700">{currentCard.definition}</p>
                </div>
              </div>
            </div>

            <button onClick={handleNext} disabled={currentIndex === set.cards.length - 1} className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
              <FaArrowRight />
            </button>
          </div>

          <p className="mt-4 text-center text-gray-500">{currentIndex + 1} / {set.cards.length}</p>
        </div>
      </main>
    </div>
  );
}

export default FlashcardSetDetail;
