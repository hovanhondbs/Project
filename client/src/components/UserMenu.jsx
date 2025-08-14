// src/components/UserMenu.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FaBell, FaTrophy, FaCog, FaSignOutAlt, FaTimes } from 'react-icons/fa';

import fallbackAvatar from '../assets/icon/20250730_2254_image.png';
import avatar1 from '../assets/image/avatar1.jpeg';
import avatar2 from '../assets/image/avatar2.jpeg';
import avatar3 from '../assets/image/avatar3.jpeg';
import avatar4 from '../assets/image/avatar4.jpeg';
import avatar5 from '../assets/image/avatar5.jpeg';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const SOCKET_URL = API_BASE;

// Username rule: Unicode letters (incl. Vietnamese) + numbers + '.' + '_' + spaces; length 3–20
const USERNAME_REGEX = /^[\p{L}\p{M}\p{N}._ ]{3,20}$/u;
const looksLikeEmail = (s) => /@/.test(s || '');
const isAllDigits = (s) => /^\d+$/.test((s || '').replace(/\s+/g, ''));

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
  const navigate = useNavigate();
  const bellRef = useRef(null);
  const localAvatarRef = useRef(null);
  const menuRef = avatarRef || localAvatarRef;

  // ===== Notifications
  const [showNotif, setShowNotif] = useState(false);
  const [teacherNotifs, setTeacherNotifs] = useState([]);
  const [studentNotifs, setStudentNotifs] = useState([]);
  const [studentBadge, setStudentBadge] = useState(0);
  const [actingId, setActingId] = useState(null);

  // ===== Profile editor
  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState('');
  const [origUsername, setOrigUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [menuAvatar, setMenuAvatar] = useState(fallbackAvatar);
  const [preview, setPreview] = useState(fallbackAvatar);
  const [fileObj, setFileObj] = useState(null);
  const [useSuggested, setUseSuggested] = useState(false);
  const [suggestedUrl, setSuggestedUrl] = useState('');
  const fileInputRef = useRef(null);
  const suggestedAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

  // username check realtime
  const [uChecking, setUChecking] = useState(false);
  const [uAvail, setUAvail] = useState(null); // null | true | false
  const [uError, setUError] = useState('');   // error text

  // ===== Socket
  const socketRef = useRef(null);
  const isTeacher = String(userData?.role || '').toLowerCase() === 'teacher';

  useEffect(() => {
    if (!userData?._id) return;
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = s;
    s.emit('register', { userId: userData._id });

    const onNotifNew = () => {
      if (isTeacher) return;
      setStudentBadge((b) => b + 1);
      if (showNotif) {
        axios.get(`${API_BASE}/api/notifications/list/${userData._id}`)
          .then(r => setStudentNotifs(r.data || []))
          .catch(() => {});
      }
    };
    s.on('notif:new', onNotifNew);

    const onJoinPending = () => {
      if (!isTeacher) return;
      refreshBellForTeacher();
      if (showNotif) {
        axios.get(`${API_BASE}/api/classrooms/pending-requests/${userData._id}`)
          .then(r => setTeacherNotifs(r.data || []))
          .catch(() => {});
      }
    };
    s.on('join:pending', onJoinPending);

    return () => {
      s.off('notif:new', onNotifNew);
      s.off('join:pending', onJoinPending);
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?._id, isTeacher, showNotif]);

  // ===== Hydrate UI từ userData
  useEffect(() => {
    if (!userData) return;
    const abs = toAbsUrl(userData.avatar);
    setUsername(userData.username || '');
    setOrigUsername(userData.username || '');
    setDisplayName(userData.username || '');
    setMenuAvatar(abs);
    setPreview(abs);
    setFileObj(null);
    setUseSuggested(false);
    setSuggestedUrl('');
    setUError('');
    setUAvail(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [userData, showSettings]);

  // ===== Click-outside (ESLint-safe deps)
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotif(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [setDropdownOpen, setShowNotif, menuRef, bellRef]);

  // ===== Badge HS khi load
  useEffect(() => {
    if (!userData?._id || isTeacher) return;
    axios.get(`${API_BASE}/api/notifications/count/${userData._id}`)
      .then(r => setStudentBadge(r.data?.count || 0))
      .catch(() => setStudentBadge(0));
  }, [userData?._id, isTeacher]);

  // ===== Toggle chuông
  const toggleNotif = async () => {
    const willShow = !showNotif;
    setShowNotif(willShow);
    if (!willShow || !userData?._id) return;

    if (isTeacher) {
      try {
        const r = await axios.get(`${API_BASE}/api/classrooms/pending-requests/${userData._id}`);
        setTeacherNotifs(r.data || []);
      } catch { setTeacherNotifs([]); }
    } else {
      try {
        const r = await axios.get(`${API_BASE}/api/notifications/list/${userData._id}`);
        setStudentNotifs(r.data || []);
      } catch { setStudentNotifs([]); }
      try {
        await axios.post(`${API_BASE}/api/notifications/mark-all-seen/${userData._id}`);
        setStudentBadge(0);
      } catch {}
    }
  };

  // ===== GV approve/reject
  const refreshBellForTeacher = async () => {
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
      await axios.post(`${API_BASE}/api/classrooms/${n.classId}/approve`, { studentId: n.studentId, approve });
      setTeacherNotifs(prev => prev.filter(x => !(x.classId === n.classId && x.studentId === n.studentId)));
      await refreshBellForTeacher();
      if (approve && currentClassId && String(currentClassId) === String(n.classId)) onApproved?.();
    } catch {
      // ignore alert
    } finally {
      setActingId(null);
    }
  };

  // ===== Username validate (client) + debounce check trùng
  const usernameClean = useMemo(() => (username || '').trim(), [username]);

  useEffect(() => {
    setUError('');
    setUAvail(null);

    // If name unchanged -> skip checks
    if (usernameClean === (origUsername || '')) return;

    // Same rules as signup
    if (!USERNAME_REGEX.test(usernameClean)) {
      setUError('3–20 characters. Letters (incl. Vietnamese), spaces, dot, and underscore allowed.');
      return;
    }
    if (isAllDigits(usernameClean)) {
      setUError('Username cannot be numbers only.');
      return;
    }
    if (looksLikeEmail(usernameClean)) {
      setUError('Username cannot be an email address.');
      return;
    }

    // Debounce availability check
    let t = setTimeout(async () => {
      try {
        setUChecking(true);
        const r = await axios.get(`${API_BASE}/api/auth/check-username`, { params: { username: usernameClean } });
        setUAvail(!!r.data?.available);
        if (!r.data?.available) setUError('Username is already taken.');
      } catch {
        setUAvail(null);
      } finally {
        setUChecking(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [usernameClean, origUsername]);

  // ===== Avatar editor helpers
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileObj(f);
    setUseSuggested(false);
    setSuggestedUrl('');
    setPreview(URL.createObjectURL(f));
  };
  const onPickSuggested = (url) => { setUseSuggested(true); setSuggestedUrl(url); setFileObj(null); setPreview(url); };

  const canSave = useMemo(() => {
    const changingName = usernameClean !== (origUsername || '');
    const nameOk = !changingName || (!uError && uAvail !== false);
    return nameOk;
  }, [usernameClean, origUsername, uError, uAvail]);

  const saveProfile = async () => {
    if (!userData?._id) return;

    if (usernameClean !== (origUsername || '')) {
      if (!USERNAME_REGEX.test(usernameClean)) { setUError('3–20 characters. Letters (incl. Vietnamese), spaces, dot, and underscore allowed.'); return; }
      if (isAllDigits(usernameClean)) { setUError('Username cannot be numbers only.'); return; }
      if (looksLikeEmail(usernameClean)) { setUError('Username cannot be an email address.'); return; }
      if (uAvail === false) { setUError('Username is already taken.'); return; }
    }

    try {
      const form = new FormData();
      if (usernameClean !== (origUsername || '')) form.append('username', usernameClean);
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
      setOrigUsername(updated.username || usernameClean);
      setShowSettings(false);
      setDropdownOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (err?.response?.status === 409 || /taken/i.test(msg)) {
        setUError('Username is already taken.');
      } else if (err?.response?.status === 400) {
        setUError(msg || 'Invalid username.');
      } else {
        alert('Update failed. Please try again.');
      }
    }
  };

  return (
    <div className="flex items-center gap-4 ml-4">
      {/* ===== Bell ===== */}
      <div className="relative" ref={bellRef}>
        <button onClick={toggleNotif} className="relative p-2 rounded-full hover:bg-gray-100" title="Notifications">
          <FaBell className="text-gray-700" size={20} />
          {(isTeacher ? (bellCount > 0) : (studentBadge > 0)) && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {isTeacher ? bellCount : studentBadge}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 border-b font-semibold">Notifications</div>

            {isTeacher ? (
              teacherNotifs.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No new requests</div>
              ) : (
                teacherNotifs.map((n, i) => (
                  <div key={`${n.classId}_${n.studentId}_${i}`} className="px-4 py-3 border-b text-sm">
                    <div className="font-semibold">{n.studentName}</div>
                    <div className="text-gray-600">wants to join <span className="font-semibold">{n.className}</span></div>
                    <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
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
                ))
              )
            ) : (
              studentNotifs.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No notifications</div>
              ) : (
                studentNotifs.map((n, i) => (
                  <div key={`${n._id || i}`} className="px-4 py-3 border-b text-sm cursor-pointer hover:bg-gray-50"
                       onClick={() => n.link ? navigate(n.link) : null}>
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-gray-600">{n.message}</div>
                    <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>

      {/* ===== Avatar + Profile menu ===== */}
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

        {/* ===== Profile editor modal ===== */}
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
                placeholder="John Doe"
              />
              {/* hint/validation */}
              <div className="text-xs mt-1">
                {usernameClean !== (origUsername || '') && (
                  <>
                    {uChecking && <span className="text-gray-500">Checking…</span>}
                    {!uChecking && uAvail === true && !uError && <span className="text-green-600">Username is available</span>}
                    {!uChecking && uAvail === false && <span className="text-red-600">Username is taken</span>}
                  </>
                )}
                {uError && <div className="text-red-600">{uError}</div>}
              </div>

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
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-600 hover:underline">
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={!canSave}
                  className={`px-4 py-2 text-white rounded ${!canSave ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
