import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import UserMenu from '../components/UserMenu';
import axios from 'axios';

function CreateClassPage() {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState(false);
  const [descError, setDescError] = useState(false); // ✅ thêm error cho description
  const navigate = useNavigate();

  const avatarRef = useRef();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return setLoading(false);

    axios.get(`http://localhost:5000/api/user/${userId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error("Error loading user", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');

    let valid = true;

    if (!className.trim()) {
      setNameError(true);
      valid = false;
    } else {
      setNameError(false);
    }

    if (!description.trim()) {
      setDescError(true);
      valid = false;
    } else {
      setDescError(false);
    }

    if (!valid) return;

    try {
      const res = await axios.post('http://localhost:5000/api/classrooms', {
        name: className,
        description,
        createdBy: userId,
      });

      alert(`Lớp "${res.data.name}" đã được tạo!`);
      navigate('/dashboard-teacher');
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.error === 'Tên lớp đã tồn tại') {
        alert('❌ Lớp đã tồn tại, vui lòng chọn tên khác.');
        setNameError(true);
      } else {
        console.error('Failed to create class:', err);
        alert('❌ Không thể tạo lớp');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col items-center">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6 w-full max-w-6xl">
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

        <h2 className="text-2xl font-bold text-blue-700 mb-6 self-start max-w-3xl">Create a New Class</h2>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded p-10 w-full max-w-3xl space-y-6"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Class Name</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className={`w-full px-5 py-3 rounded-lg text-lg border ${
                nameError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter class name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-5 py-3 rounded-lg text-lg border ${
                descError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter class description"
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white text-lg px-8 py-3 rounded-lg hover:bg-blue-700"
          >
            Create
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateClassPage;
