import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import KetQuaHocTap from './KetQuaHocTap';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';
import logLearningActivity from '../components/ActivityLogger';


function LearnMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const avatarRef = useRef();

  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
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

  const current = cards[index];

  const handleCheck = () => {
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = current.definition.trim().toLowerCase();
    const isRight = normalizedUser === normalizedCorrect;
    setIsCorrect(isRight);
    if (isRight) setScore(score + 1);
    setShowResult(true);
  };

  const handleNext = () => {
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
    if (index < cards.length - 1) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      logLearningActivity(); // 👈 Ghi log sau khi học xong
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!cards.length) return <div className="text-center mt-10">Loading Learn Mode...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
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

        <div className="flex justify-center items-center min-h-[400px]">
          {finished ? (
            <KetQuaHocTap
              score={score}
              total={cards.length}
              mode="Learn"
              onRetry={() => window.location.reload()}
            />
          ) : (
            <div className="w-full max-w-xl p-8 bg-white rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">✍️ Learn Mode</h2>
              <p className="text-gray-600 text-center mb-4">Type the correct definition for the following term:</p>
              <div className="text-2xl font-semibold text-center text-indigo-600 mb-6">{current.term}</div>

              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 border rounded-xl mb-4"
                disabled={showResult}
              />

              {!showResult ? (
                <button onClick={handleCheck} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl">
                  Check Answer
                </button>
              ) : (
                <div className="mt-4 text-center">
                  {isCorrect ? (
                    <p className="text-green-600 font-semibold text-lg">Correct! 🎉</p>
                  ) : (
                    <>
                      <p className="text-red-600 font-semibold text-lg">Incorrect ❌</p>
                      <p className="mt-2 text-gray-700">Correct answer: <strong>{current.definition}</strong></p>
                    </>
                  )}
                  <button onClick={handleNext} className="mt-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl">
                    Next →
                  </button>
                </div>
              )}

              <p className="mt-6 text-center text-sm text-gray-500">{index + 1} / {cards.length}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default LearnMode;
