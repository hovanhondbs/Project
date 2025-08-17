// client/src/pages/FlashcardSetDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { FiFlag, FiX, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import './FlashcardSetDetail.css';
import StudyModes from '../components/StudyModes';
import EditRemoveButtons from '../components/EditRemoveButtons';
import UserMenu from '../components/UserMenu';
import SearchInput from '../components/SearchInput';
import Sidebar from '../components/Sidebar';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const RECAPTCHA_SITE_KEY =
  process.env.REACT_APP_RECAPTCHA_SITE_KEY ||
  (import.meta?.env?.VITE_RECAPTCHA_SITE_KEY ?? ''); // hỗ trợ Vite nếu bạn dùng

const abs = (src) => {
  if (!src) return '';
  const s = String(src).replace(/\\/g, '/').trim();
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  if (/^\/?uploads\//i.test(s)) return `${API}/${s.replace(/^\/+/, '')}`;
  return `${API}/${s.replace(/^\/+/, '')}`;
};

const REPORT_REASONS = [
  { value: 'incorrect_content', label: 'Incorrect content' },
  { value: 'child_safety', label: 'Child safety / exploitation risk' },
  { value: 'adult_content', label: 'Adult / 18+ content' },
  { value: 'spam_or_ads', label: 'Spam or advertising' },
];

// Recaptcha helpers
function ensureRecaptchaScript() {
  return new Promise((resolve) => {
    if (!RECAPTCHA_SITE_KEY) return resolve(null);
    if (window.grecaptcha && window.grecaptcha.execute) return resolve(window.grecaptcha);
    const existing = document.getElementById('recaptcha-v3');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.grecaptcha));
      return;
    }
    const s = document.createElement('script');
    s.id = 'recaptcha-v3';
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.async = true;
    s.onload = () => resolve(window.grecaptcha);
    document.body.appendChild(s);
  });
}

async function getRecaptchaToken(action = 'report_submit') {
  if (!RECAPTCHA_SITE_KEY) return null;
  const gre = await ensureRecaptchaScript();
  if (!gre?.ready) return null;
  await gre.ready();
  try {
    const token = await gre.execute(RECAPTCHA_SITE_KEY, { action });
    return token || null;
  } catch {
    return null;
  }
}

function FlashcardSetDetail() {
  const navigate = useNavigate();
  const avatarRef = useRef();
  const reportBtnRef = useRef();
  const reportMenuRef = useRef();
  const { id } = useParams();

  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [setData, setSetData] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const handleInputChange = (e) => setSearchTerm(e.target.value);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate('/search', { state: { query: searchTerm } });
    }
  };

  // Report UI
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);

  // Load user
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');

    axios
      .get(`${API}/api/user/${storedUserId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setUserData(res.data))
      .catch((err) => console.error('Fetch user info error:', err?.response?.data || err))
      .finally(() => setLoading(false));
  }, []);

  // Preload reCAPTCHA (non-blocking)
  useEffect(() => {
    ensureRecaptchaScript();
  }, []);

  // Load set detail
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const fetchSet = async () => {
      try {
        setFetchError('');
        const res = await axios.get(`${API}/api/flashcards/${id}`);
        setSetData(res.data);

        if (res.data?._id) {
          // local recent
          let recentList = JSON.parse(localStorage.getItem('recentSetIds')) || [];
          recentList = recentList.filter((setId) => setId !== res.data._id);
          recentList.unshift(res.data._id);
          recentList = recentList.slice(0, 5);
          localStorage.setItem('recentSetIds', JSON.stringify(recentList));

          // server recent (gửi kèm Authorization để tránh 500)
          if (storedUserId && token) {
            axios
              .put(
                `${API}/api/user/${storedUserId}/recent-view`,
                { setId: res.data._id },
                { headers: { Authorization: `Bearer ${token}` } }
              )
              .catch((err) => console.error('Save recent error:', err?.response?.data || err.message));
          }
        }
      } catch (error) {
        console.error('Fetch set detail error:', error?.response?.data || error);
        if (error?.response?.status === 404) {
          setFetchError('This set is unavailable (removed or under review).');
        } else {
          setFetchError('Failed to load this set.');
        }
      }
    };
    fetchSet();
  }, [id]);

  // click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (
        reportOpen &&
        reportMenuRef.current &&
        !reportMenuRef.current.contains(e.target) &&
        reportBtnRef.current &&
        !reportBtnRef.current.contains(e.target)
      ) {
        setReportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [reportOpen]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const isOwner =
    userData && setData && String(userData._id) === String(setData.userId?._id || setData.userId);

  const currentCard = setData?.cards?.[currentIndex];

  const handleNext = () => {
    if (!setData) return;
    if (currentIndex < (setData.cards?.length || 0) - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  // Report handlers
  const onPickReason = (reason) => {
    setSelectedReason(reason);
    setReportOpen(false);
    setConfirmOpen(true);
    setReportMessage(null);
    setDetails('');
  };

  const submitReport = async () => {
    if (!selectedReason) return;
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!userId || !token) {
      setReportMessage({ type: 'error', text: 'Please sign in to report this set.' });
      return;
    }

    setSubmitting(true);
    setReportMessage(null);
    try {
      // Lấy recaptcha token (nếu có key) — nếu không có sẽ null
      const recaptchaToken = await getRecaptchaToken('report_submit');

      const headers = { Authorization: `Bearer ${token}` };
      // Dev bypass: nếu không có site key, gửi thêm header x-recaptcha: 'test'
      if (!RECAPTCHA_SITE_KEY) headers['x-recaptcha'] = 'test';

      const res = await axios.post(
        `${API}/api/reports`,
        {
          setId: setData._id,
          reasonCode: selectedReason.value,
          details,
          recaptchaToken,
        },
        { headers }
      );

      if (res?.data?.duplicated) {
        setReportMessage({
          type: 'info',
          text: 'You already reported this set recently. Thanks for your help!',
        });
      } else {
        setReportMessage({
          type: 'success',
          text: 'Your report was submitted. Our team will review it shortly.',
        });
      }
      setTimeout(() => setConfirmOpen(false), 900);
    } catch (err) {
      const status = err?.response?.status;
      const payload = err?.response?.data;
      console.log('REPORT ERROR', status, payload);

      if (status === 429) {
        setReportMessage({
          type: 'error',
          text: 'You have reached the daily report limit. Please try again later.',
        });
      } else if (status === 400 && payload?.error === 'invalid_reason') {
        setReportMessage({ type: 'error', text: 'Invalid reason.' });
      } else if (status === 404 && payload?.error === 'set_not_found') {
        setReportMessage({ type: 'error', text: 'This set no longer exists.' });
      } else if (status === 403 && payload?.error?.startsWith('recaptcha')) {
        setReportMessage({ type: 'error', text: 'reCAPTCHA verification failed. Please try again.' });
      } else if (status === 401) {
        setReportMessage({ type: 'error', text: 'Your session has expired. Please sign in again.' });
      } else if (status === 400 && payload?.error === 'cannot_report_own_set') {
        setReportMessage({ type: 'error', text: 'You cannot report your own set.' });
      } else {
        setReportMessage({ type: 'error', text: 'Failed to submit report. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchError) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <SearchInput
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search flashcards or classes..."
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

          <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
            <div className="flex items-center gap-3 text-red-700 mb-2">
              <FiAlertTriangle />
              <h1 className="text-xl font-semibold">Set unavailable</h1>
            </div>
            <p className="text-gray-600">{fetchError}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!setData) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <SearchInput
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search flashcards or classes..."
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

        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">{setData.title}</h1>
              <p className="text-gray-600">{setData.description}</p>
              {(setData.hidden || setData.isHidden) && (
                <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  This set is hidden and won’t appear in search results.
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOwner && <EditRemoveButtons flashcardId={setData._id} />}

              {!isOwner && (
                <div className="relative">
                  <button
                    ref={reportBtnRef}
                    onClick={() => setReportOpen((v) => !v)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50"
                    title="Report this set"
                  >
                    <FiFlag />
                    Report
                  </button>

                  {reportOpen && (
                    <div
                      ref={reportMenuRef}
                      className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
                    >
                      <div className="p-2 text-sm text-gray-500 border-b">Choose a reason</div>
                      <ul className="max-h-64 overflow-auto">
                        {REPORT_REASONS.map((r) => (
                          <li key={r.value}>
                            <button
                              onClick={() => onPickReason(r)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            >
                              {r.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {setData.cards?.length ? (
            <>
              <div className="flashcard-viewer mt-6">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  <FaArrowLeft />
                </button>

                <div className="flashcard hover-flip">
                  <div className="flashcard-inner">
                    <div className="flashcard-front">
                      <p className="text-xl font-bold">{currentCard?.term}</p>
                      {currentCard?.image && (
                        <img
                          src={abs(currentCard.image)}
                          alt="term"
                          className="mt-4 w-full h-32 object-contain"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="flashcard-back">
                      <p className="text-lg text-center text-gray-700">
                        {currentCard?.definition}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === setData.cards.length - 1}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  <FaArrowRight />
                </button>
              </div>

              <p className="mt-4 text-center text-gray-500">
                {currentIndex + 1} / {setData.cards.length}
              </p>
            </>
          ) : (
            <div className="mt-6 text-gray-500">No cards in this set.</div>
          )}

          <div className="mt-6">
            <StudyModes />
          </div>
        </div>
      </main>

      {confirmOpen && selectedReason && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Confirm report</h3>
              <button
                onClick={() => setConfirmOpen(false)}
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-sm">
                <div className="text-gray-600 mb-1">Reason</div>
                <div className="font-medium">{selectedReason.label}</div>
              </div>

              <div className="text-sm">
                <div className="text-gray-600 mb-1">Additional details (optional)</div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Add any context that helps us review faster..."
                />
              </div>

              {reportMessage && (
                <div
                  className={`text-sm rounded px-3 py-2 ${
                    reportMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : reportMessage.type === 'info'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {reportMessage.text}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 text-gray-600 hover:underline">
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={submitting}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlashcardSetDetail;
