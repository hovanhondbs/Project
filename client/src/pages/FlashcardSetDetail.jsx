import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaArrowRight
} from 'react-icons/fa';
import axios from 'axios';
import './FlashcardSetDetail.css';
import StudyModes from '../components/StudyModes';
import EditRemoveButtons from '../components/EditRemoveButtons';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';



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

        // ✅ Ghi lại vào danh sách recentSetIds
        if (res.data?._id) {
          let recentList = JSON.parse(localStorage.getItem("recentSetIds")) || [];

          // Xoá nếu đã có
          recentList = recentList.filter(setId => setId !== res.data._id);

          // Thêm mới vào đầu
          recentList.unshift(res.data._id);

          // Giới hạn 5 bộ
          recentList = recentList.slice(0, 5);

          localStorage.setItem("recentSetIds", JSON.stringify(recentList));
          // ✅ Gửi recent lên MongoDB
if (storedUserId && res.data._id) {
  axios.put(`http://localhost:5000/api/user/${storedUserId}/recent-view`, {
    setId: res.data._id
  }).catch(err => console.error("Lỗi lưu recent lên DB:", err));
}

        }
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
    if (currentIndex < set.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      {/* Main content */}
      <main className="flex-1 p-8">
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

        {/* Flashcard Viewer */}
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-2">{set.title}</h1>
          <p className="text-gray-600 mb-6">{set.description}</p>
          <EditRemoveButtons flashcardId={set._id} />
          <div className="flashcard-viewer">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
              <FaArrowLeft />
            </button>

            <div className="flashcard hover-flip">
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
          <StudyModes />
        </div>
      </main>
    </div>
  );
}

export default FlashcardSetDetail;
