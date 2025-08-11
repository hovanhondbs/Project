// src/components/UserMenu.jsx — English UI, allow avatar-only update, unique name check
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

// Normalize avatar URL from API
const toAbsUrl = (src) => {
  if (!src) return fallbackAvatar;
  let s = String(src).replace(/\\/g, '/').trim();
  if (/^(https?:|blob:|data:)/i.test(s)) return s; // full url/blob/data
  if (/^\/?uploads\//i.test(s)) return `${API_BASE}/${s.replace(/^\/+/, '')}`; // server uploads
  if (/^\/(static|assets)\//i.test(s)) return s; // FE static assets
  return `${API_BASE}/${s.replace(/^\/+/, '')}`; // other relatives
};

export default function UserMenu({
  avatarRef,
  dropdownOpen,
  setDropdownOpen,
  userData,
  loading,
  handleLogout,
  onProfileUpdated = () => {},
}) {
  const [showSettings, setShowSettings] = useState(false);
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

  const willChangeName = () => {
    const t = (username || '').trim();
    return !!t && t !== userData?.username;
  };

  // Only validate when user actually changes the name
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
    } catch (e) {
      console.error('check-username error', e);
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
    // Validate name only if changing it
    if (willChangeName()) {
      const ok = await checkUsername(username);
      if (!ok) return;
    } else {
      setNameError('');
    }

    try {
      if (!userData?._id) return;
      const form = new FormData();
      if (willChangeName()) form.append('username', (username || '').trim()); // send only if changed
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
      console.error('Update profile error:', err);
      if (err?.response?.status === 409) setNameError('This username is already taken');
      else alert('Update failed. Please try again.');
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
              <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer" onClick={() => setShowSettings(true)}>
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
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs">Upload</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  </div>

                  <div className="flex gap-2">
                    {suggestedAvatars.map((img, i) => (
                      <img key={i} src={img} alt={`Avatar ${i + 1}`} className="w-10 h-10 rounded-full cursor-pointer hover:border-2 hover:border-blue-400 object-cover" onClick={() => onPickSuggested(img)} />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-2">Username <span className="text-gray-400 text-xs">(leave empty to keep current)</span></label>
                <input
                  type="text"
                  placeholder={userData?.username || ''}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => checkUsername(username)}
                  className={`w-full px-3 py-2 border rounded-lg ${willChangeName() && nameError ? 'border-red-500' : ''}`}
                />
                {willChangeName() && nameError && <p className="text-red-600 text-xs mt-1">{nameError}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={checking || (willChangeName() && !!nameError)}
                  className={`px-4 py-2 rounded-lg text-white ${checking || (willChangeName() && nameError) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
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
