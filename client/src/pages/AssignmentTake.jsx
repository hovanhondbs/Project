// src/pages/AssignmentTake.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import UserMenu from '../components/UserMenu';
// ✅ FIX: đúng thư mục components
import KetQuaHocTap from '../components/KetQuaHocTap';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function AssignmentTake() {
  const { id } = useParams(); // assignmentId
  const navigate = useNavigate();
  const avatarRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const [assignment, setAssignment] = useState(null);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);

  const [mcqOptions, setMcqOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [textAns, setTextAns] = useState('');

  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [totalLeft, setTotalLeft] = useState(0);
  const [qLeft, setQLeft] = useState(0);

  const perQ = assignment?.perQuestionSeconds || 30;
  const totalSeconds = useMemo(() => (cards.length * perQ), [cards.length, perQ]);

  // Search box
  const [searchTerm, setSearchTerm] = useState('');
  const handleInputChange = (e) => setSearchTerm(e.target.value);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) navigate('/search', { state: { query: searchTerm } });
  };

  // Load user
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { setLoadingUser(false); return; }
    axios.get(`${API}/api/user/${userId}`)
      .then(r => setUserData(r.data))
      .finally(() => setLoadingUser(false));
  }, []);

  // Load assignment + check submitted
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    (async () => {
      const a = await axios.get(`${API}/api/assignments/${id}`).then(r => r.data);
      setAssignment(a);
      setCards(a?.set?.cards || []);
      if (userId) {
        const sub = await axios.get(`${API}/api/assignments/${id}/submission/${userId}`).then(r => r.data);
        if (sub?.submitted) {
          setAlreadySubmitted(true);
          setFinished(true);
          setScore(sub.score || 0);
        }
      }
    })().catch(() => {});
  }, [id]);

  // Prepare MCQ options
  useEffect(() => {
    if (!assignment || assignment.mode !== 'test') return;
    if (!cards.length) return;
    if (index >= cards.length) return;
    const correct = cards[index].definition;
    const wrong = cards.filter((_, i) => i !== index).map(c => c.definition);
    setMcqOptions(shuffle([correct, ...shuffle(wrong).slice(0, 3)]));
  }, [assignment, cards, index]);

  // Timers
  useEffect(() => {
    if (!cards.length || finished || alreadySubmitted || !assignment) return;
    const tStart = Date.now();
    setTotalLeft(totalSeconds);
    setQLeft(perQ);

    const tick = setInterval(() => {
      const passed = Math.floor((Date.now() - tStart) / 1000);
      const newTotal = Math.max(totalSeconds - passed, 0);
      const newQ = Math.max(perQ - (passed % perQ), 0);
      setTotalLeft(newTotal);
      setQLeft(newQ);

      if (newQ === 0) {
        // auto move when hết 30s của câu hiện tại
        handleAutoAdvance();
      }
      if (newTotal === 0) {
        finalizeAndSubmit();
      }
    }, 500);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, finished, assignment?.mode]);

  const mmss = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const current = cards[index];

  const handleAutoAdvance = () => {
    if (!assignment) return;
    if (assignment.mode === 'test') {
      // không chọn xem như sai
      goNext(false);
    } else {
      // Learn: không nhập xem như sai
      goNext(false);
    }
  };

  const goNext = (isCorrect) => {
    if (isCorrect) setScore((s) => s + 1);
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setSelected(null);
      setTextAns('');
    } else {
      finalizeAndSubmit();
    }
  };

  const handleSelect = (choice) => {
    if (selected != null) return;
    setSelected(choice);
    const ok = choice === current.definition;
    // hiển thị nhanh 300ms rồi qua câu tiếp
    setTimeout(() => goNext(ok), 300);
  };

  const handleCheckText = () => {
    const user = (textAns || '').trim().toLowerCase();
    const ok = user === (current.definition || '').trim().toLowerCase();
    setTimeout(() => goNext(ok), 150);
  };

  const finalizeAndSubmit = async () => {
    setFinished(true);
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
      const res = await axios.post(`${API}/api/assignments/${id}/submit`, {
        studentId: userId,
        score,
        total: cards.length,
        details: [],
      });
      if (res.status === 201) {
        // ok
      }
    } catch (err) {
      // Nếu đã nộp rồi -> giữ trạng thái xem điểm
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!assignment) return <div className="p-10">Loading assignment...</div>;

  const closed = new Date() > new Date(assignment.deadline);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6">
          <SearchInput value={searchTerm} onChange={handleInputChange} onKeyDown={handleKeyDown} />
          <UserMenu
            avatarRef={avatarRef}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            userData={userData}
            loading={loadingUser}
            handleLogout={handleLogout}
          />
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              Assignment: <span className="text-blue-700">{assignment.title}</span> ({assignment.mode.toUpperCase()})
            </h1>
            <div className="text-sm">
              <span className="font-semibold">Time left:</span> {mmss(totalLeft)}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Per-question timer: {mmss(qLeft)} • Questions: {cards.length} • Deadline: {new Date(assignment.deadline).toLocaleString()}
          </div>

          {alreadySubmitted ? (
            <div className="mt-8">
              <KetQuaHocTap score={score} total={cards.length} mode={assignment.mode === 'test' ? 'Test' : 'Learn'} />
              <p className="text-center text-gray-500 mt-4">You have already submitted this assignment.</p>
            </div>
          ) : closed ? (
            <div className="mt-8 text-center text-red-600 font-semibold">
              This assignment is closed (deadline passed).
            </div>
          ) : finished ? (
            <div className="mt-8">
              <KetQuaHocTap score={score} total={cards.length} mode={assignment.mode === 'test' ? 'Test' : 'Learn'} />
              <p className="text-center text-gray-500 mt-4">Your responses have been submitted.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 border-t pt-6">
                <div className="text-center text-lg text-gray-700 mb-2">
                  Question {index + 1} / {cards.length}
                </div>
                <div className="text-2xl font-semibold text-center text-indigo-600 mb-6">{current?.term}</div>

                {assignment.mode === 'test' ? (
                  <div className="space-y-3">
                    {mcqOptions.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect(c)}
                        disabled={selected != null}
                        className={`w-full px-5 py-3 text-left rounded-xl border transition ${
                          selected == null
                            ? 'bg-white hover:bg-blue-50 border-gray-300'
                            : c === current.definition
                            ? 'bg-green-100 border-green-400 text-green-700'
                            : c === selected
                            ? 'bg-red-100 border-red-400 text-red-700'
                            : 'bg-white border-gray-300 opacity-70'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto">
                    <input
                      value={textAns}
                      onChange={(e) => setTextAns(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl mb-4"
                      placeholder="Type your answer..."
                    />
                    <button
                      onClick={handleCheckText}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl"
                    >
                      Check Answer
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
