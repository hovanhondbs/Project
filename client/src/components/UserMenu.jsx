// src/components/UserMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaTrophy, FaCog, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Ảnh mặc định + avatar gợi ý
import fallbackAvatar from '../assets/icon/20250730_2254_image.png';
import avatar1 from '../assets/image/avatar1.jpeg';
import avatar2 from '../assets/image/avatar2.jpeg';
import avatar3 from '../assets/image/avatar3.jpeg';
import avatar4 from '../assets/image/avatar4.jpeg';
import avatar5 from '../assets/image/avatar5.jpeg';

const API_BASE = 'http://localhost:5000'; // 👈 dùng baseURL rõ ràng

function UserMenu({ avatarRef, dropdownOpen, setDropdownOpen, userData, loading, handleLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState('');
  const [preview, setPreview] = useState(fallbackAvatar); // ảnh hiển thị trong popup
  const [useSuggested, setUseSuggested] = useState(false);
  const [suggestedUrl, setSuggestedUrl] = useState(''); // URL ảnh gợi ý đã chọn
  const [fileObj, setFileObj] = useState(null); // file upload (nếu có)
  const fileInputRef = useRef();

  const suggestedAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5];
  
  // Sync dữ liệu ban đầu khi mở Settings
  useEffect(() => {
    if (userData) {
      setUsername(userData.username || '');
      const current = userData.avatar ? (userData.avatar.startsWith('http') ? userData.avatar : `${API_BASE}/${userData.avatar}`) : fallbackAvatar;
      setPreview(current);
      setUseSuggested(false);
      setSuggestedUrl('');
      setFileObj(null);
    }
  }, [userData, showSettings]);

  const onPickSuggested = (imgUrl) => {
    setUseSuggested(true);
    setSuggestedUrl(imgUrl);
    setPreview(imgUrl);
    setFileObj(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileObj(file);
    setUseSuggested(false);
    setSuggestedUrl('');
    setPreview(URL.createObjectURL(file)); // chỉ để preview
  };

  const handleSave = async () => {
    try {
      if (!userData?._id) return;

      const formData = new FormData();
      formData.append('username', username || '');

      // Ưu tiên file upload; nếu không có file thì dùng avatarUrl (gợi ý)
      if (fileObj) {
        formData.append('avatar', fileObj);
      } else if (useSuggested && suggestedUrl) {
        formData.append('avatarUrl', suggestedUrl);
      }

      await axios.put(`${API_BASE}/api/user/${userData._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowSettings(false);
      setDropdownOpen(false);
      // Có thể tối ưu thành set state cha; tạm thời reload để đồng bộ hết nơi dùng avatar
      window.location.reload();
    } catch (err) {
      console.error('Update profile error:', err);
      alert('Update failed.');
    }
  };

  // Ảnh đang hiển thị ở menu (ưu tiên path tĩnh server)
  const menuAvatar = userData?.avatar
    ? (userData.avatar.startsWith('http') ? userData.avatar : `${API_BASE}/${userData.avatar}`)
    : fallbackAvatar;

  return (
    <div className="flex items-center gap-4 ml-4 relative">
      <FaBell className="text-xl text-gray-500 hover:text-blue-600 cursor-pointer" />
      <div className="relative" ref={avatarRef}>
        <img
          src={menuAvatar}
          alt="User avatar"
          className="w-14 h-14 rounded-full border-2 border-gray-300 cursor-pointer object-cover"
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
              <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                <Link to="/achievements" className="flex items-center gap-2 w-full h-full">
                  <FaTrophy /> Achievements
                </Link>
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                onClick={() => setShowSettings(true)}
              >
                <FaCog /> Settings
              </li>
              <li onClick={handleLogout} className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                <FaSignOutAlt /> Log out
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Settings Popup */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button onClick={() => setShowSettings(false)}>
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar */}
              <div>
                <label className="block mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={preview}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-xs">Upload</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex gap-2">
                    {suggestedAvatars.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Avatar ${i + 1}`}
                        className="w-10 h-10 rounded-full cursor-pointer hover:border-2 hover:border-blue-400 object-cover"
                        onClick={() => onPickSuggested(img)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
