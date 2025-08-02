import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaCog, FaTrophy, FaSignOutAlt, FaHome, FaBook, FaRegClone } from 'react-icons/fa';
import avatarImage from '../assets/icon/20250730_2254_image.png';
import axios from 'axios';
import { useParams } from 'react-router-dom';
function CreateFlashcardSet() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const location = useLocation();
  const avatarRef = useRef();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState([{ term: '', definition: '', image: null }]);
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFixedButton, setShowFixedButton] = useState(false);

  // Lấy userId từ localStorage
  const userId = localStorage.getItem('userId');

  // Lấy thông tin người dùng
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    axios.get(`http://localhost:5000/api/user/${userId}`)
      .then((res) => setUserData(res.data))
      .catch((err) => console.error("Lỗi lấy user info:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  // Lấy thông tin bộ thẻ nếu có
  useEffect(() => {
  if (id) {
    axios.get(`http://localhost:5000/api/flashcards/${id}`)
      .then((res) => {
        setTitle(res.data.title);
        setDescription(res.data.description);
        setCards(res.data.cards.map(card => ({
          term: card.term,
          definition: card.definition,
          image: card.image || null
        })));
      })
      .catch(err => console.error('Lỗi load flashcard:', err));
  }
}, [id]);

  // Dropdown avatar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll xử lý nút cố định
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setShowFixedButton(position > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCardChange = (index, field, value) => {
    const updated = [...cards];
    updated[index][field] = value;
    setCards(updated);
  };

  const handleImageUpload = (index, file) => {
    const updated = [...cards];
    updated[index].image = file;
    setCards(updated);
  };

  const removeImage = (index) => {
    const updated = [...cards];
    updated[index].image = null;
    setCards(updated);
  };

  const addCard = () => {
    setCards([...cards, { term: '', definition: '', image: null }]);
  };

  const removeCard = (index) => {
    const updated = [...cards];
    updated.splice(index, 1);
    setCards(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Vui lòng nhập tên bộ thẻ.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('userId', userId);

      const filteredCards = cards.map((card) => ({
  term: card.term,
  definition: card.definition,
  image: typeof card.image === 'string' ? card.image : null
}));

cards.forEach((card) => {
  if (card.image && typeof card.image !== 'string') {
    formData.append('images[]', card.image); // chỉ thêm ảnh mới
  }
});

formData.append('cards', JSON.stringify(filteredCards));


      if (isEditMode) {
  await axios.put(`http://localhost:5000/api/flashcards/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  alert('Cập nhật thành công!');
} else {
  await axios.post('http://localhost:5000/api/flashcards', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  alert('Tạo flashcard thành công!');
}


      alert('Tạo flashcard thành công!');
      setTitle('');
      setDescription('');
      setCards([{ term: '', definition: '', image: null }]);
      navigate('/library');

    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert('Tên bộ thẻ đã tồn tại. Vui lòng chọn tên khác.');
      } else {
        console.error(err);
        alert('Lỗi khi lưu dữ liệu.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-white p-4">
        <h1 className="text-blue-600 text-2xl font-bold mb-8">FlashCard</h1>
        <nav className="space-y-1 text-gray-700">
          <Link to="/dashboard-user" className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${location.pathname === '/dashboard-user' ? 'bg-blue-100 text-blue-600' : 'hover:bg-blue-50 hover:text-blue-600'}`}>
            <div className={`p-2 rounded-full ${location.pathname === '/dashboard-user' ? 'bg-blue-600 text-white' : ''}`}><FaHome /></div>
            Home
          </Link>
          <Link to="/library" className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${location.pathname === '/library' ? 'bg-[#08D9AA] text-white' : 'hover:bg-[#08D9AA]/20 hover:text-[#08D9AA]'}`}>
            <div className={`p-2 rounded-full ${location.pathname === '/library' ? 'bg-white text-[#08D9AA]' : ''}`}><FaBook /></div>
            Your Library
          </Link>
          <Link to="/flashcards" className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${location.pathname === '/flashcards' ? 'bg-[#8731EB] text-white' : 'hover:bg-[#8731EB]/20 hover:text-[#8731EB]'}`}>
            <div className={`p-2 rounded-full ${location.pathname === '/flashcards' ? 'bg-white text-[#8731EB]' : ''}`}><FaRegClone /></div>
            Flashcards
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 relative">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6 relative">
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Search for study guides" className="w-full px-10 py-2 border rounded-2xl shadow-sm" />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center gap-4 ml-4 relative">
            <FaBell className="text-xl text-gray-500 hover:text-blue-600 cursor-pointer" />
            <div className="relative" ref={avatarRef}>
              <img src={userData?.avatar || avatarImage} alt="User avatar" className="w-14 h-14 rounded-full border-2 border-gray-300 cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)} />
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                  <div className="px-4 py-3 border-b">
                    {loading ? <p className="text-sm text-gray-500">Loading...</p> : <>
                      <p className="font-semibold text-sm">{userData?.username || "Username"}</p>
                      <p className="text-xs text-gray-500">{userData?.email || "email@example.com"}</p>
                    </>}
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

        {/* Form tạo flashcard */}
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow-lg relative">
          <h2 className="text-2xl font-bold mb-6">Create a Flashcard Set</h2>
          <form onSubmit={handleSubmit}>
            <input className="w-full mb-4 px-3 py-2 border rounded shadow" placeholder="Topic" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="w-full mb-4 px-3 py-2 border rounded shadow" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            {cards.map((card, index) => (
              <div key={index} className="mb-4 p-4 border rounded shadow bg-gray-50 relative">
                <input className="w-full mb-2 px-3 py-2 border rounded shadow" placeholder="Word" value={card.term} onChange={(e) => handleCardChange(index, 'term', e.target.value)} />
                <input className="w-full mb-2 px-3 py-2 border rounded shadow" placeholder="Meaning" value={card.definition} onChange={(e) => handleCardChange(index, 'definition', e.target.value)} />
                <div className="mb-2">
                  {card.image ? (
                    <div className="relative w-28 h-28">
                      <img src={typeof card.image === 'string' ? `http://localhost:5000/${card.image}` : URL.createObjectURL(card.image)}  alt="preview"  className="w-28 h-28 object-cover border rounded shadow"/>
                      <button type="button" className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded" onClick={() => removeImage(index)}>✕</button>
                    </div>
                  ) : (
                    <label className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded cursor-pointer text-gray-500 shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16l4-4a2 2 0 012.828 0L13 16m4 0h1a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2h1" />
                      </svg>
                      <span className="text-sm">Upload Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(index, e.target.files[0])} />
                    </label>
                  )}
                </div>
                <button type="button" className="text-red-600 text-sm mt-1" onClick={() => removeCard(index)}>Remove card</button>
              </div>
            ))}
            <button type="button" className="text-blue-600 font-semibold mb-4" onClick={addCard}>+ Add card</button>
            <div className={`transition-all duration-300 ${showFixedButton ? 'fixed bottom-4 right-6 z-50' : 'mt-6'}`}>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                Save Flashcard Set
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateFlashcardSet;
