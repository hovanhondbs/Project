import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KetQuaHocTap from './KetQuaHocTap';
import axios from 'axios';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';
import logLearningActivity from '../components/ActivityLogger';

function MatchMode() {
  const { id } = useParams();
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
        logLearningActivity();
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
        <Sidebar />
      {/* Main */}
      <main className="flex-1 p-6">
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
