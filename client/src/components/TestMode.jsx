import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome, FaBook, FaRegClone, FaSearch, FaBell,
  FaTrophy, FaCog, FaSignOutAlt
} from 'react-icons/fa';
import axios from 'axios';
import avatarImage from '../assets/icon/20250730_2254_image.png';
import KetQuaHocTap from './KetQuaHocTap';

function TestMode() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const avatarRef = useRef();

  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const storedUserId = localStorage.getItem("userId");

  useEffect(() => {
    axios.get(`http://localhost:5000/api/flashcards/${id}`)
      .then(res => setCards(res.data.cards || []))
      .catch(err => console.error("Error loading flashcards:", err));
  }, [id]);

  useEffect(() => {
    if (cards.length > 0 && index < cards.length) {
      const correct = cards[index].definition;
      const wrong = cards.filter((_, i) => i !== index).map(c => c.definition);
      const choices = shuffleArray([correct, ...shuffleArray(wrong).slice(0, 3)]);
      setOptions(choices);
      setSelected(null);
    }
  }, [cards, index]);

  useEffect(() => {
    if (!storedUserId) return;
    axios.get(`http://localhost:5000/api/user/${storedUserId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error("Error fetching user:", err))
      .finally(() => setLoading(false));
  }, [storedUserId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const handleSelect = (choice) => {
    setSelected(choice);
    setShowResult(true);
    if (choice === cards[index].definition) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!cards.length) return <div className="text-center mt-10">Loading test...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-white p-4">
        <h1 className="text-blue-600 text-2xl font-bold mb-8">FlashCard</h1>
        <nav className="space-y-1 text-gray-700">
          <Link to="/dashboard-user" className={`flex items-center gap-3 px-3 py-2 rounded ${location.pathname === '/dashboard-user' ? 'bg-blue-100 text-blue-600' : 'hover:bg-blue-50 hover:text-blue-600'}`}>
            <FaHome /> Home
          </Link>
          <Link to="/library" className={`flex items-center gap-3 px-3 py-2 rounded ${location.pathname === '/library' ? 'bg-[#08D9AA] text-white' : 'hover:bg-[#08D9AA]/20 hover:text-[#08D9AA]'}`}>
            <FaBook /> Your Library
          </Link>
          <Link to="/flashcards" className={`flex items-center gap-3 px-3 py-2 rounded ${location.pathname === '/flashcards' ? 'bg-[#8731EB] text-white' : 'hover:bg-[#8731EB]/20 hover:text-[#8731EB]'}`}>
            <FaRegClone /> Flashcards
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Topbar */}
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

        {/* Content */}
        <div className="flex justify-center items-center">
          {finished ? (
            <KetQuaHocTap
              score={score}
              total={cards.length}
              mode="Test"
              onRetry={() => window.location.reload()}
            />
          ) : (
            <div className="w-full max-w-xl p-8 bg-white rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold text-center text-purple-700 mb-4">🧪 Test Mode</h2>
              <div className="text-lg text-center mb-6 text-gray-600">Question {index + 1} of {cards.length}</div>
              <div className="text-xl text-center font-semibold text-blue-600 mb-6">{cards[index].term}</div>

              <div className="space-y-4">
                {options.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(choice)}
                    disabled={showResult}
                    className={`w-full px-5 py-3 text-left rounded-xl transition duration-200 border font-medium
                      ${
                        selected
                          ? choice === cards[index].definition
                            ? 'bg-green-100 border-green-400 text-green-700'
                            : choice === selected
                            ? 'bg-red-100 border-red-400 text-red-700'
                            : 'bg-white'
                          : 'bg-white hover:bg-blue-50 border-gray-300'
                      }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              {showResult && (
                <div className="mt-6 text-center">
                  {selected === cards[index].definition ? (
                    <p className="text-green-600 font-bold text-lg mt-4">✅ Correct!</p>
                  ) : (
                    <p className="text-red-600 font-bold text-lg mt-4">
                      ❌ Incorrect. Correct answer: <strong>{cards[index].definition}</strong>
                    </p>
                  )}
                  <button
                    onClick={handleNext}
                    className="mt-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TestMode;
