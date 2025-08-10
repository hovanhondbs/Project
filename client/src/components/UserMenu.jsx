// src/components/UserMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaTrophy, FaCog, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';

import fallbackAvatar from '../assets/icon/20250730_2254_image.png';
import avatar1 from '../assets/image/avatar1.jpeg';
import avatar2 from '../assets/image/avatar2.jpeg';
import avatar3 from '../assets/image/avatar3.jpeg';
import avatar4 from '../assets/image/avatar4.jpeg';
import avatar5 from '../assets/image/avatar5.jpeg';

// CRA env
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Chuẩn hoá URL ảnh từ BE
const toAbsUrl = (src) => {
  if (!src) return fallbackAvatar;
  const s = String(src);

  // đã là url đầy đủ / blob / data
  if (/^(https?:|blob:|data:)/i.test(s)) return s;

  // static FE (/assets, /static)
  if (s.startsWith('/')) return s;

  // file BE (uploads/...)
  if (s.startsWith('uploads/')) return `${API_BASE}/${s.replace(/^\/+/, '')}`;

  // fallback
  return `${API_BASE}/${s.replace(/^\/+/, '')}`;
};

function UserMenu({ avatarRef, dropdownOpen, setDropdownOpen, userData, loading, handleLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState('');
  const [preview, setPreview] = useState(fallbackAvatar);
  const [menuAvatar, setMenuAvatar] = useState(fallbackAvatar);
  const [useSuggested, setUseSuggested] = useState(false);
  const [suggestedUrl, setSuggestedUrl] = useState('');
  const [fileObj, setFileObj] = useState(null);
  const fileInputRef = useRef();

  const suggestedAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

  // nạp dữ liệu ban đầu
  useEffect(() => {
    if (!userData) return;
    setUsername(userData.username || '');
    const abs = toAbsUrl(userData.avatar);
    setPreview(abs);
    setMenuAvatar(abs);
    setUseSuggested(false);
    setSuggestedUrl('');
    setFileObj(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [userData, showSettings]);

  const onPickSuggested = (imgUrl) => {
    setUseSuggested(true);
    setSuggestedUrl(imgUrl);     // ảnh tĩnh FE
    setPreview(imgUrl);          // xem trước ngay trong modal
    setFileObj(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileObj(f);
    setUseSuggested(false);
    setSuggestedUrl('');
    setPreview(URL.createObjectURL(f)); // xem trước tức thì
  };

  const handleSave = async () => {
    try {
      if (!userData?._id) return;

      const form = new FormData();
      form.append('username', username || '');
      if (fileObj) form.append('avatar', fileObj);
      else if (useSuggested && suggestedUrl) form.append('avatarUrl', suggestedUrl);

      const res = await axios.put(`${API_BASE}/api/user/${userData._id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // cập nhật UI ngay
      const updated = res.data;
      const abs = toAbsUrl(updated.avatar);
      setMenuAvatar(abs);
      setPreview(abs);
      setUsername(updated.username || username);

      setShowSettings(false);
      setDropdownOpen(false);
    } catch (err) {
      console.error('Update profile error:', err);
      alert('Update failed.');
    }
  };

  return (
    <div className="flex items-center gap-4 ml-4 relative">
      <FaBell className="text-xl text-gray-500 hover:text-blue-600 cursor-pointer" />
      <div className="relative" ref={avatarRef}>
        <img
          src={menuAvatar}
          alt="User avatar"
          className="w-14 h-14 rounded-full border-2 border-gray-300 cursor-pointer object-cover"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
        />
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
            <div className="px-4 py-3 border-b">
              {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : (
                <>
                  {/* hiển thị username từ state để thấy ngay tên mới */}
                  <p className="font-semibold text-sm">{username}</p>
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
              <div>
                <label className="block mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={preview}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-xs">Upload</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  </div>

                  <div className="flex gap-2">
                    {[avatar1, avatar2, avatar3, avatar4, avatar5].map((img, i) => (
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

              <div>
                <label className="block mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-lg border border-gray-300">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
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
