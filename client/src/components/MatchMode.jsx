import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaBell, FaSearch, FaCog, FaTrophy, FaSignOutAlt,
  FaHome, FaBook, FaRegClone
} from 'react-icons/fa';
import avatarImage from '../assets/icon/20250730_2254_image.png';
import KetQuaHocTap from './KetQuaHocTap';
import axios from 'axios';

function MatchMode() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const avatarRef = useRef();

  const [cards, setCards] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matched, setMatched] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [completed, setCompleted] = useState(false);

  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const storedUserId = localStorage.getItem("userId");

  useEffect(() => {
    axios.get(`http://localhost:5000/api/flashcards/${id}`)
      .then(res => {
        const shuffled = shufflePairs(res.data.cards || []);
        setCards(res.data.cards);
        setPairs(shuffled);
        setStartTime(Date.now());
      })
      .catch(err => console.error("Error loading match data:", err));
  }, [id]);

  useEffect(() => {
    if (!storedUserId) return;
    axios.get(`http://localhost:5000/api/user/${storedUserId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error("Error loading user:", err))
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const shufflePairs = (cards) => {
    const items = cards.flatMap(card => [
      { type: 'term', id: card._id, text: card.term },
      { type: 'definition', id: card._id, text: card.definition },
    ]);
    return items.sort(() => Math.random() - 0.5);
  };

  const handleSelect = (item) => {
    if (selected.length === 1 && selected[0].id === item.id && selected[0].type !== item.type) {
      setMatched([...matched, item.id]);
      setSelected([]);
      if (matched.length + 1 === cards.length) {
        setCompleted(true);
      }
    } else if (selected.length === 1) {
      setTimeout(() => setSelected([]), 600);
      setSelected([item]);
    } else {
      setSelected([item]);
    }
  };

  const isMatched = (item) => matched.includes(item.id);
  const isSelected = (item) => selected.some(s => s.text === item.text && s.type === item.type);
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

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

      {/* Main */}
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
        <div className="w-full max-w-5xl p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-3xl font-extrabold text-center text-blue-700 mb-4">🧠 Match Mode</h2>

          {completed ? (
            <div className="flex justify-center items-center">
              <KetQuaHocTap
                score={cards.length}
                total={cards.length}
                duration={elapsedSeconds}
                mode="Match"
                onRetry={() => window.location.reload()}
              />
            </div>
          ) : (
            <>
              <p className="text-center text-gray-600 mb-6">Click one term and its correct definition to match them!</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pairs.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => !isMatched(item) && handleSelect(item)}
                    className={`p-4 rounded-xl text-center font-semibold shadow-md transition-transform duration-200
                      ${isMatched(item)
                        ? 'bg-green-100 border border-green-400 text-gray-400'
                        : isSelected(item)
                        ? 'bg-yellow-200 border border-yellow-500 scale-105'
                        : 'bg-gradient-to-br from-blue-50 to-white hover:scale-105 hover:shadow-lg'}`}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default MatchMode;
