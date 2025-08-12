import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBell, FaTrophy, FaCog, FaSignOutAlt, FaTimes } from 'react-icons/fa';

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
  avatarRef,
  dropdownOpen,
  setDropdownOpen,
  userData,
  loading,
  handleLogout,
  bellCount = 0,
  onBellChange,
  currentClassId,
  onApproved,
}) {
  const bellRef = useRef(null);
  const localAvatarRef = useRef(null);
  const menuRef = avatarRef || localAvatarRef;

  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [actingId, setActingId] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [menuAvatar, setMenuAvatar] = useState(fallbackAvatar);
  const [preview, setPreview] = useState(fallbackAvatar);
  const [fileObj, setFileObj] = useState(null);
  const [nameError, setNameError] = useState('');
  const [useSuggested, setUseSuggested] = useState(false);
  const [suggestedUrl, setSuggestedUrl] = useState('');
  const fileInputRef = useRef(null);
  const suggestedAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

  useEffect(() => {
    if (!userData) return;
    const abs = toAbsUrl(userData.avatar);
    setUsername(userData.username || '');
    setDisplayName(userData.username || '');
    setMenuAvatar(abs);
    setPreview(abs);
    setFileObj(null);
    setUseSuggested(false);
    setSuggestedUrl('');
    setNameError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [userData, showSettings]);

  // click-outside
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotif(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [setDropdownOpen]);

  // toggle chuông + fetch danh sách pending
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

  const refreshBell = async () => {
    if (!userData?._id) return;
    try {
      const r = await axios.get(`${API_BASE}/api/classrooms/pending-count/${userData._id}`);
      onBellChange?.(r.data?.count || 0);
    } catch {
      onBellChange?.(0);
    }
  };

  const handleDecision = async (n, approve) => {
    try {
      setActingId(`${n.classId}_${n.studentId}_${approve}`);
      await axios.post(`${API_BASE}/api/classrooms/${n.classId}/approve`, {
        studentId: n.studentId, approve
      });
      setNotifs(prev => prev.filter(x => !(x.classId === n.classId && x.studentId === n.studentId)));
      await refreshBell();
      if (approve && currentClassId && String(currentClassId) === String(n.classId)) {
        onApproved?.();
      }
    } catch {
      alert('Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setActingId(null);
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileObj(f);
    setUseSuggested(false);
    setSuggestedUrl('');
    setPreview(URL.createObjectURL(f));
  };
  const onPickSuggested = (url) => {
    setUseSuggested(true);
    setSuggestedUrl(url);
    setFileObj(null);
    setPreview(url);
  };
  const willChangeName = () => (userData?.username || '') !== (username || '').trim();

  const saveProfile = async () => {
    setNameError('');
    if (!userData?._id) return;
    try {
      const form = new FormData();
      if (willChangeName()) form.append('username', (username || '').trim());
      if (fileObj) form.append('avatar', fileObj);
      else if (useSuggested && suggestedUrl) form.append('avatarUrl', suggestedUrl);

      const res = await axios.put(`${API_BASE}/api/user/${userData._id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = res.data;
      const abs = `${toAbsUrl(updated.avatar)}?t=${Date.now()}`;
      setMenuAvatar(abs);
      setPreview(abs);
      setDisplayName(updated.username || displayName);
      setShowSettings(false);
      setDropdownOpen(false);
    } catch (err) {
      if (err?.response?.status === 409) setNameError('This username is already taken');
      else alert('Update failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center gap-4 ml-4">
      {/* Chuông thông báo */}
      <div className="relative" ref={bellRef}>
        <button onClick={toggleNotif} className="relative p-2 rounded-full hover:bg-gray-100" title="Notifications">
          <FaBell className="text-gray-700" size={20} />
          {bellCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {bellCount}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 border-b font-semibold">Notifications</div>
            {notifs.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No new requests</div>
            ) : (
              notifs.map((n, i) => (
                <div key={`${n.classId}_${n.studentId}_${i}`} className="px-4 py-3 border-b text-sm flex items-center gap-3">
                  <img
                    src={toAbsUrl(n.studentAvatar)}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                  />
                  <div className="flex-1">
                    <p>
                      <span className="font-semibold">{n.studentName}</span> wants to join{' '}
                      <span className="font-semibold">{n.className}</span>
                    </p>
                    <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        className="px-2.5 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                        disabled={actingId === `${n.classId}_${n.studentId}_true`}
                        onClick={(e) => { e.stopPropagation(); handleDecision(n, true); }}
                      >
                        {actingId === `${n.classId}_${n.studentId}_true` ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        className="px-2.5 py-1 rounded bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 disabled:opacity-50"
                        disabled={actingId === `${n.classId}_${n.studentId}_false`}
                        onClick={(e) => { e.stopPropagation(); handleDecision(n, false); }}
                      >
                        {actingId === `${n.classId}_${n.studentId}_false` ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Avatar dropdown + Profile editor (giữ như trước, có cập nhật nhỏ) */}
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
              <li>
                <Link to="/achievements" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                  <FaTrophy /> Achievements
                </Link>
              </li>
              <li>
                <button onClick={() => setShowSettings(true)} className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                  <FaCog /> Profile & Avatar
                </button>
              </li>
              <li>
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600">
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </ul>
          </div>
        )}

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-md relative">
              <button onClick={() => setShowSettings(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black" aria-label="Close">
                <FaTimes />
              </button>
              <h2 className="text-xl font-semibold mb-4">Update Profile</h2>

              <label className="block text-sm mb-1 font-medium">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border px-3 py-2 rounded mb-1"
                placeholder="Enter username"
              />
              {nameError && <div className="text-red-600 text-xs mb-2">{nameError}</div>}

              <label className="block text-sm mb-1 font-medium mt-3">Avatar</label>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-16 h-16">
                  <img
                    src={preview}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 text-white text-xs rounded-full"
                    title="Upload"
                  >
                    Upload
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
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

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-600 hover:underline">Cancel</button>
                <button onClick={saveProfile} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
