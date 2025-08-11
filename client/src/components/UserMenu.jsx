// src/components/UserMenu.jsx — notifications + avatar editor + click-outside for bell & avatar
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

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const toAbsUrl = (src) => {
  if (!src) return fallbackAvatar;
  let s = String(src).replace(/\\/g, '/').trim();
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  if (/^\/?uploads\//i.test(s)) return `${API_BASE}/${s.replace(/^\/+/, '')}`;
  if (/^\/(static|assets)\//i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, '')}`;
};

export default function UserMenu({
  avatarRef,                 // optional (từ parent); nếu không có, component tự tạo ref
  dropdownOpen,
  setDropdownOpen,
  userData,
  loading,
  handleLogout,
  onProfileUpdated = () => {},
  bellCount = 0,
}) {
  // Refs
  const bellRef = useRef(null);
  const localAvatarRef = useRef(null);
  const menuRef = avatarRef || localAvatarRef; // dùng ref truyền vào hoặc ref nội bộ

  // UI states
  const [showSettings, setShowSettings] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState([]);

  // Profile editor
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [preview, setPreview] = useState(fallbackAvatar);
  const [menuAvatar, setMenuAvatar] = useState(fallbackAvatar);
  const [useSuggested, setUseSuggested] = useState(false);
  const [suggestedUrl, setSuggestedUrl] = useState('');
  const [fileObj, setFileObj] = useState(null);
  const [nameError, setNameError] = useState('');
  const [checking, setChecking] = useState(false);
  const fileInputRef = useRef();

  const suggestedAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

  // Hydrate from userData
  useEffect(() => {
    if (!userData) return;
    const abs = toAbsUrl(userData.avatar);
    setUsername(userData.username || '');
    setDisplayName(userData.username || '');
    setPreview(abs);
    setMenuAvatar(abs);
    setUseSuggested(false);
    setSuggestedUrl('');
    setFileObj(null);
    setNameError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [userData, showSettings]);

  // Click-outside cho bell dropdown & avatar dropdown
  useEffect(() => {
    const onDocMouseDown = (e) => {
      // bell
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotif(false);
      }
      // avatar menu
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuRef, setDropdownOpen]);

  const willChangeName = () => {
    const t = (username || '').trim();
    return !!t && t !== userData?.username;
  };

  const checkUsername = async (name) => {
    const trimmed = (name || '').trim();
    if (!willChangeName()) { setNameError(''); return true; }
    if (trimmed.length < 3) { setNameError('Username must be at least 3 characters'); return false; }
    try {
      setChecking(true);
      const res = await axios.get(`${API_BASE}/api/user/check-username`, { params: { username: trimmed } });
      if (!res.data?.available) { setNameError('This username is already taken'); return false; }
      setNameError('');
      return true;
    } catch {
      setNameError('Could not verify username. Please try again');
      return false;
    } finally {
      setChecking(false);
    }
  };

  const onPickSuggested = (imgUrl) => {
    setUseSuggested(true);
    setSuggestedUrl(imgUrl);
    setPreview(imgUrl);
    setFileObj(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileObj(f);
    setUseSuggested(false);
    setSuggestedUrl('');
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (willChangeName()) {
      const ok = await checkUsername(username);
      if (!ok) return;
    } else {
      setNameError('');
    }

    try {
      if (!userData?._id) return;
      const form = new FormData();
      if (willChangeName()) form.append('username', (username || '').trim()); // chỉ gửi nếu đổi
      if (fileObj) form.append('avatar', fileObj);
      else if (useSuggested && suggestedUrl) form.append('avatarUrl', suggestedUrl);

      const res = await axios.put(`${API_BASE}/api/user/${userData._id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updated = res.data;
      const abs = `${toAbsUrl(updated.avatar)}?t=${Date.now()}`; // cache-busting
      setMenuAvatar(abs);
      setPreview(abs);
      setDisplayName(updated.username || displayName);
      setShowSettings(false);
      setDropdownOpen(false);
      onProfileUpdated(updated);
    } catch (err) {
      if (err?.response?.status === 409) setNameError('This username is already taken');
      else alert('Update failed. Please try again.');
    }
  };

  // Notifications
  const toggleNotif = async () => {
    const willShow = !showNotif;
    setShowNotif(willShow);
    if (willShow && userData?._id) {
      try {
        const r = await axios.get(`${API_BASE}/api/classrooms/pending-requests/${userData._id}`);
        setNotifs(r.data || []);
      } catch {
        setNotifs([]);
      }
    }
  };

  return (
    <div className="flex items-center gap-4 ml-4 relative">
      {/* Bell + badge + dropdown */}
      <div className="relative" ref={bellRef}>
        <FaBell
          className="text-xl text-gray-500 hover:text-blue-600 cursor-pointer"
          onClick={toggleNotif}
        />
        {bellCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {bellCount}
          </span>
        )}
        {showNotif && (
          <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 border-b font-semibold">Notifications</div>
            {notifs.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No new requests</div>
            ) : (
              notifs.map((n, i) => (
                <div key={i} className="px-4 py-3 border-b text-sm flex items-center gap-3">
                  <img
                    src={n.studentAvatar ? toAbsUrl(n.studentAvatar) : fallbackAvatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                  />
                  <div>
                    <p>
                      <span className="font-semibold">{n.studentName}</span> wants to join{' '}
                      <span className="font-semibold">{n.className}</span>
                    </p>
                    <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Avatar dropdown */}
      <div className="relative" ref={menuRef}>
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
                  <p className="font-semibold text-sm">{displayName}</p>
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
              <li
                onClick={handleLogout}
                className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
              >
                <FaSignOutAlt /> Log out
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Settings modal */}
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
                <label className="block mb-2">Profile picture</label>
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

              <div>
                <label className="block mb-2">
                  Username <span className="text-gray-400 text-xs">(leave empty to keep current)</span>
                </label>
                <input
                  type="text"
                  placeholder={userData?.username || ''}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => checkUsername(username)}
                  className={`w-full px-3 py-2 border rounded-lg ${willChangeName() && nameError ? 'border-red-500' : ''}`}
                />
                {willChangeName() && nameError && (
                  <p className="text-red-600 text-xs mt-1">{nameError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={checking || (willChangeName() && !!nameError)}
                  className={`px-4 py-2 rounded-lg text-white ${
                    checking || (willChangeName() && nameError)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {checking ? 'Checking…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
