import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';

function CreateFlashcardSet() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const avatarRef = useRef();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState([{ term: '', definition: '', image: null }]);
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFixedButton, setShowFixedButton] = useState(false);
  const [errors, setErrors] = useState({});

  // --- NEW: state cho gợi ý ---
  const [suggestionsMap, setSuggestionsMap] = useState({}); // { [index]: string[] }
  const [suggestOpenIndex, setSuggestOpenIndex] = useState(null);
  const suggestTimersRef = useRef({}); // debounce timer theo index

  const userId = localStorage.getItem('userId');
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e) => setSearchTerm(e.target.value);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate('/search', { state: { query: searchTerm } });
    }
  };

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      // đóng dropdown gợi ý nếu click ngoài
      if (!e.target.closest('.suggest-wrap')) {
        setSuggestOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowFixedButton(window.scrollY > 300);
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
    setErrors(prev => ({ ...prev, [`card-${index}`]: false }));
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
    setSuggestionsMap(prev => {
      const cp = { ...prev };
      delete cp[index];
      return cp;
    });
    if (suggestOpenIndex === index) setSuggestOpenIndex(null);
  };

  // --- NEW: gọi API gợi ý (debounce) ---
  const fetchSuggestions = async (index, value) => {
    if (!value || value.trim().length < 2) {
      setSuggestionsMap(prev => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const res = await axios.get('http://localhost:5000/api/ai/suggest', {
        params: { term: value, topic: title, src: 'en', dst: 'vi' }
      });
      setSuggestionsMap(prev => ({ ...prev, [index]: res.data?.suggestions || [] }));
      setSuggestOpenIndex(index);
    } catch (e) {
      console.error('Lỗi gợi ý:', e?.response?.data || e.message);
    }
  };

  const onTermInputChange = (index, value) => {
    handleCardChange(index, 'term', value);
    clearTimeout(suggestTimersRef.current[index]);
    suggestTimersRef.current[index] = setTimeout(() => {
      fetchSuggestions(index, value);
    }, 350);
  };

  const pickSuggestion = (index, text) => {
    handleCardChange(index, 'term', text);
    setSuggestionsMap(prev => ({ ...prev, [index]: [] }));
    setSuggestOpenIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!title.trim()) newErrors.title = true;
    if (!description.trim()) newErrors.description = true;

    cards.forEach((card, i) => {
      if (!card.term.trim() || !card.definition.trim()) {
        newErrors[`card-${i}`] = true;
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      alert("Vui lòng điền đầy đủ tất cả các trường.");
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
          formData.append('images[]', card.image);
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

      setTitle('');
      setDescription('');
      setCards([{ term: '', definition: '', image: null }]);
      setErrors({});
      navigate('/library');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setErrors(prev => ({ ...prev, title: true }));
        alert('Tên bộ thẻ đã tồn tại. Vui lòng chọn tên khác.');
      } else {
        console.error(err);
        alert('Lỗi khi lưu dữ liệu.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 relative">
        <div className="flex items-center justify-between mb-6 relative">
          <SearchInput
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <UserMenu
            avatarRef={avatarRef}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            userData={userData}
            loading={loading}
            handleLogout={handleLogout}
          />
        </div>

        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow-lg relative">
          <h2 className="text-2xl font-bold mb-6">Create a Flashcard Set</h2>
          <form onSubmit={handleSubmit}>
            <input
              className={`w-full mb-4 px-3 py-2 border rounded shadow ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Topic"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors(prev => ({ ...prev, title: false }));
              }}
            />

            <textarea
              className={`w-full mb-4 px-3 py-2 border rounded shadow ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors(prev => ({ ...prev, description: false }));
              }}
            />

            {cards.map((card, index) => (
              <div key={index} className={`mb-4 p-4 border rounded shadow bg-gray-50 relative ${errors[`card-${index}`] ? 'border-red-500' : ''}`}>
                {/* Ô Word + gợi ý */}
                <div className="suggest-wrap relative">
                  <input
                    className="w-full mb-2 px-3 py-2 border rounded shadow"
                    placeholder="Word"
                    value={card.term}
                    onChange={(e) => onTermInputChange(index, e.target.value)}
                    onFocus={() => {
                      if ((suggestionsMap[index] || []).length) setSuggestOpenIndex(index);
                    }}
                  />

                  {/* Dropdown gợi ý */}
                  {suggestOpenIndex === index && (suggestionsMap[index]?.length > 0) && (
                    <ul className="absolute left-0 right-0 top-full z-20 bg-white border rounded shadow mt-1 max-h-60 overflow-auto">
                      {suggestionsMap[index].map((s, i) => (
                        <li key={`${i}-${s}`}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-100"
                            onClick={() => pickSuggestion(index, typeof s === 'string' ? s : (s.word || ''))}
                          >
                            {typeof s === 'string' ? s : (s.word || JSON.stringify(s))}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <input
                  className="w-full mb-2 px-3 py-2 border rounded shadow"
                  placeholder="Meaning"
                  value={card.definition}
                  onChange={(e) => handleCardChange(index, 'definition', e.target.value)}
                />

                <div className="mb-2">
                  {card.image ? (
                    <div className="relative w-28 h-28">
                      <img
                        src={typeof card.image === 'string' ? `http://localhost:5000/${card.image}` : URL.createObjectURL(card.image)}
                        alt="preview"
                        className="w-28 h-28 object-cover border rounded shadow"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
                        onClick={() => removeImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded cursor-pointer text-gray-500 shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 16l4-4a2 2 0 012.828 0L13 16m4 0h1a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2h1" />
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
