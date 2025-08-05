import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import KetQuaHocTap from './KetQuaHocTap';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';
import logLearningActivity from '../components/ActivityLogger';



function TestMode() {
  const { id } = useParams();

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
      logLearningActivity();
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
      <Sidebar />
      {/* Main Content */}
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
