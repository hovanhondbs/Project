// src/pages/ClassroomDetail.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import UserMenu from '../components/UserMenu';
import EditClassButton from '../components/EditClassButton';
import DeleteClassButton from '../components/DeleteClassButton';
import ShareClassButton from '../components/ShareClassButton';
import fallbackAvatar from '../assets/icon/20250730_2254_image.png'; // 🔹 fallback giống UserMenu

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

/** 🔹 Chuẩn hoá URL avatar (đồng bộ với UserMenu)
 * - Thay "\" -> "/"
 * - Hỗ trợ http(s)/blob/data
 * - Hỗ trợ đường dẫn /uploads/... và /assets|/static/...
 * - Mặc định prefix bằng API
 */
const toAbsUrl = (src) => {
  if (!src) return fallbackAvatar;
  let s = String(src).replace(/\\/g, '/').trim();
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  if (/^\/?uploads\//i.test(s)) return `${API}/${s.replace(/^\/+/, '')}`;
  if (/^\/(static|assets)\//i.test(s)) return s;
  return `${API}/${s.replace(/^\/+/, '')}`;
};

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments');
  const [pending, setPending] = useState(false);
  const [bell, setBell] = useState(0);

  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [mySets, setMySets] = useState([]);
  const [createForm, setCreateForm] = useState({ setId: '', mode: 'test', deadline: '' });

  // Results
  const [resLoading, setResLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [resAssignments, setResAssignments] = useState([]); // ✅
  const [filterA, setFilterA] = useState('all');
  const [filterS, setFilterS] = useState('all');

  // Members (UI tối giản)
  const [mLoading, setMLoading] = useState(false);
  const [mItems, setMItems] = useState([]);
  const [mTotal, setMTotal] = useState(0);
  const [mPage, setMPage] = useState(1);
  const [mPages, setMPages] = useState(1);
  const MEMBERS_PER_PAGE = 10;

  const userIdLS = localStorage.getItem('userId');

  // ---- Fetch helpers ----
  const fetchClass = useCallback(async () => {
    const res = await axios.get(`${API}/api/classrooms/${id}`);
    setClassData(res.data);
    return res.data;
  }, [id]);

  const fetchUser = useCallback(async () => {
    const uid = userIdLS;
    if (!uid) return null;
    const res = await axios.get(`${API}/api/user/${uid}`);
    setUserData(res.data);
    return res.data;
  }, [userIdLS]);

  const fetchAssignments = useCallback(
    async (sid) => {
      const r = await axios.get(`${API}/api/assignments/class/${id}`, {
        params: { studentId: sid || userIdLS },
      });
      setAssignments(r.data || []);
    },
    [id, userIdLS]
  );

  const fetchResults = useCallback(async () => {
    try {
      setResLoading(true);
      const r = await axios.get(`${API}/api/assignments/class/${id}/results`, {
        params: { viewerId: userIdLS },
      });
      setResults(r.data?.results || []);
      setResAssignments(r.data?.assignments || []);
    } catch {
      setResults([]);
      setResAssignments([]);
    } finally {
      setResLoading(false);
    }
  }, [id, userIdLS]);

  // Members API (joinedAt desc, 10/page)
  const fetchMembers = useCallback(async () => {
    try {
      setMLoading(true);
      const r = await axios.get(`${API}/api/classrooms/${id}/members`, {
        params: { page: mPage, limit: MEMBERS_PER_PAGE },
      });
      setMItems(r.data?.students || []);
      setMTotal(r.data?.total || 0);
      setMPages(r.data?.pages || 1);
    } catch {
      setMItems([]);
      setMTotal(0);
      setMPages(1);
    } finally {
      setMLoading(false);
    }
  }, [id, mPage]);

  // ---- Initial load ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u] = await Promise.all([fetchUser(), fetchClass()]);
        if (cancelled) return;
        await fetchAssignments(u?._id || userIdLS);
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, userIdLS, fetchUser, fetchClass, fetchAssignments]);

  // Load theo tab
  useEffect(() => { if (activeTab === 'results') fetchResults(); }, [activeTab, fetchResults]);
  useEffect(() => { if (activeTab === 'members') fetchMembers(); }, [activeTab, fetchMembers]);
  useEffect(() => { if (activeTab === 'members') fetchMembers(); }, [mPage, activeTab, fetchMembers]);

  // ---- mark pending for student ----
  useEffect(() => {
    if (!classData || !userIdLS) return;
    const mine = (classData.joinRequests || []).find(
      (r) => (r.student?._id || r.student)?.toString() === userIdLS && r.status === 'pending'
    );
    setPending(!!mine);
  }, [classData, userIdLS]);

  // ---- bell badge for teacher ----
  useEffect(() => {
    if (!userData || !classData) return;
    const isT = String(userData._id) === String(classData.createdBy?._id || classData.createdBy);
    if (!isT) return;
    axios
      .get(`${API}/api/classrooms/pending-count/${userData._id}`)
      .then((r) => setBell(r.data?.count || 0))
      .catch(() => setBell(0));
  }, [userData, classData]);

  const isTeacher =
    !!userData && !!classData && String(userData._id) === String(classData.createdBy?._id || classData.createdBy);
  const isStudent = userData?.role === 'User';
  const alreadyJoined =
    !!classData && classData.students.some((s) => String(s._id || s) === String(userData?._id));
  const canSeeTabs = isTeacher || alreadyJoined;

  // ---- student requests to join ----
  const requestJoin = async () => {
    try {
      await axios.post(`${API}/api/classrooms/${id}/request-join`, { studentId: userData._id });
      setPending(true);
      await fetchClass();
    } catch {
      alert('Error sending join request.');
    }
  };

  // ---- Teacher: open modal + load own sets ----
  const openCreate = async () => {
    try {
      const uid = userIdLS || userData?._id;
      if (!uid) throw new Error('No userId');
      const r = await axios.get(`${API}/api/flashcards/user/${uid}`);
      setMySets(Array.isArray(r.data) ? r.data : []);
    } catch {
      setMySets([]);
    }
    setCreateForm({ setId: '', mode: 'test', deadline: '' });
    setShowCreate(true);
  };

  const createAssignment = async () => {
    if (!createForm.setId || !createForm.deadline) {
      alert('Please choose a set and a deadline.');
      return;
    }
    try {
      const uid = userIdLS || userData?._id;
      await axios.post(`${API}/api/assignments`, {
        classId: id,
        setId: createForm.setId,
        mode: createForm.mode,
        deadline: createForm.deadline,
        createdBy: uid,
      });
      setShowCreate(false);
      await fetchAssignments(uid);
      setActiveTab('assignments');
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // ==== Results derived: apply both filters ====
  const filteredResults = useMemo(() => {
    let arr = results;
    if (filterA !== 'all') arr = arr.filter((r) => String(r.assignmentId) === String(filterA));
    if (isTeacher && filterS !== 'all') arr = arr.filter((r) => String(r.studentId) === String(filterS));
    return arr;
  }, [results, filterA, filterS, isTeacher]);

  if (loading || !classData || !userData) return <div className="p-10">Loading...</div>;

  const removeStudent = async (studentId, username) => {
    if (!window.confirm(`Remove "${username}" from this class?`)) return;
    try {
      await axios.delete(`${API}/api/classrooms/${id}/members/${studentId}`, {
        data: { requesterId: userData._id },
      });
      await Promise.all([fetchMembers(), fetchClass()]);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to remove member');
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6">
          <SearchInput />
          <UserMenu
            avatarRef={null}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            userData={userData}
            loading={loading}
            handleLogout={handleLogout}
            bellCount={bell}
          />
        </div>

        {/* Header */}
        <div className="bg-white shadow rounded-xl p-6 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-green-700 mb-1">{classData.name}</h2>
            <p className="text-sm text-gray-600">Teacher: {classData.createdBy.username}</p>
          </div>

          {isTeacher ? (
            <div className="flex gap-3">
              <EditClassButton
                classData={classData}
                onUpdate={async () => {
                  await fetchClass();
                  await fetchAssignments(userIdLS || userData?._id);
                }}
              />
              <DeleteClassButton classId={id} onDeleteSuccess={() => navigate('/library')} />
              <ShareClassButton classId={id} />
            </div>
          ) : (
            isStudent &&
            !alreadyJoined &&
            (pending ? (
              <button
                disabled
                className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-semibold cursor-not-allowed"
              >
                Pending approval
              </button>
            ) : (
              <button
                onClick={requestJoin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
              >
                Join Class
              </button>
            ))
          )}
        </div>

        {/* Tabs */}
        {canSeeTabs ? (
          <>
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`pb-2 font-medium ${
                    activeTab === 'assignments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  Assignments
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`pb-2 font-medium ${
                    activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`pb-2 font-medium ${
                    activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  Results
                </button>
              </nav>
            </div>

            <div>
              {/* ===== Assignments tab ===== */}
              {activeTab === 'assignments' && (
                <div className="bg-white rounded-xl p-6 shadow">
                  {isTeacher && (
                    <div className="mb-4 flex justify-end">
                      <button
                        onClick={openCreate}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                      >
                        + Create assignment
                      </button>
                    </div>
                  )}

                  {assignments.length === 0 ? (
                    <p className="text-gray-500">No assignments yet.</p>
                  ) : (
                    <div className="divide-y">
                      {assignments.map((a) => (
                        <div key={a._id} className="py-4 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {a.title}{' '}
                              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {a.mode.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Questions: {a.totalQuestions} • Due:{' '}
                              {new Date(a.deadline).toLocaleString()} • {a.closed ? 'Closed' : 'Open'}
                              {isTeacher ? ` • Submissions: ${a.submissionsCount}` : ''}
                            </div>
                            {!isTeacher && a.submitted && (
                              <div className="text-xs text-green-700 mt-1">
                                Submitted • Score: {a.score}/{a.total}
                              </div>
                            )}
                          </div>

                          {!isTeacher &&
                            (a.submitted ? (
                              <Link
                                to={`/assignments/${a._id}/take`}
                                className="text-gray-600 hover:text-gray-800 underline text-sm"
                              >
                                View score
                              </Link>
                            ) : a.closed ? (
                              <span className="text-sm text-gray-400">Closed</span>
                            ) : (
                              <Link
                                to={`/assignments/${a._id}/take`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                Start
                              </Link>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== Members tab ===== */}
              {activeTab === 'members' && (
                <div className="bg-white rounded-xl p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Students</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Total <span className="font-medium">{mTotal}</span>
                      </p>
                    </div>
                    <button
                      onClick={fetchMembers}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Refresh
                    </button>
                  </div>

                  {mLoading ? (
                    <div className="text-gray-500">Loading members…</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-gray-700">
                              <th className="text-left p-2">Student</th>
                              <th className="text-left p-2">Email</th>
                              <th className="text-left p-2">Joined</th>
                              {isTeacher && <th className="text-left p-2">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {mItems.map((s) => (
                              <tr key={s._id} className="border-t">
                                <td className="p-2">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={toAbsUrl(s.avatar)}   // 🔹 dùng chuẩn hoá giống UserMenu
                                      alt="avatar"
                                      className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200 bg-white"
                                      onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                                    />
                                    <span className="font-medium text-gray-800">{s.username}</span>
                                  </div>
                                </td>
                                <td className="p-2 text-gray-600">{s.email || '-'}</td>
                                <td className="p-2 text-gray-600">{formatDate(s.joinedAt)}</td>
                                {isTeacher && (
                                  <td className="p-2">
                                    <button
                                      onClick={() => removeStudent(s._id, s.username)}
                                      className="px-3 py-1.5 rounded-lg border text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                            {mItems.length === 0 && (
                              <tr>
                                <td className="p-6 text-gray-500" colSpan={isTeacher ? 4 : 3}>
                                  No students found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          Page {mPage} / {mPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { if (mPage > 1) setMPage(mPage - 1); }}
                            disabled={mPage <= 1}
                            className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => { if (mPage < mPages) setMPage(mPage + 1); }}
                            disabled={mPage >= mPages}
                            className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ===== Results tab ===== */}
              {activeTab === 'results' && (
                <div className="bg-white rounded-xl p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Results</h3>
                    <div className="flex items-center gap-3">
                      {isTeacher && (
                        <select
                          className="border rounded px-3 py-2 text-sm"
                          value={filterS}
                          onChange={(e) => setFilterS(e.target.value)}
                        >
                          <option value="all">All students</option>
                          {(classData.students || []).map((stu) => {
                            const sid = stu._id || stu;
                            const name = stu.username || String(stu);
                            return <option key={sid} value={sid}>{name}</option>;
                          })}
                        </select>
                      )}
                      <select
                        className="border rounded px-3 py-2 text-sm"
                        value={filterA}
                        onChange={(e) => setFilterA(e.target.value)}
                      >
                        <option value="all">All assignments</option>
                        {resAssignments.map((a) => (
                          <option key={a._id} value={a._id}>{a.title} ({a.mode})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {resLoading ? (
                    <div className="text-gray-500">Loading results…</div>
                  ) : filteredResults.length === 0 ? (
                    <div className="text-gray-500">No results yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700">
                            <th className="text-left p-2">Assignment</th>
                            <th className="text-left p-2">Mode</th>
                            {isTeacher && <th className="text-left p-2">Student</th>}
                            <th className="text-left p-2">Score</th>
                            <th className="text-left p-2">Total</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Submitted at</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.map((r, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{r.assignmentTitle}</td>
                              <td className="p-2 uppercase">{r.mode}</td>
                              {isTeacher && <td className="p-2">{r.studentName}</td>}
                              <td className="p-2">{r.score == null ? '-' : r.score}</td>
                              <td className="p-2">{r.total}</td>
                              <td className="p-2">
                                {r.status === 'submitted'
                                  ? <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">Submitted</span>
                                  : <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">Not submitted</span>}
                              </td>
                              <td className="p-2">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-500 italic">You need to join the class to see assignments and members.</div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow relative">
              <button className="absolute top-3 right-3 text-gray-500" onClick={() => setShowCreate(false)}>✕</button>
              <h3 className="text-lg font-semibold mb-4">New Assignment</h3>

              <label className="block text-sm font-medium mb-1">Flashcard set</label>
              <select
                value={createForm.setId}
                onChange={(e) => setCreateForm({ ...createForm, setId: e.target.value })}
                className="w-full border rounded px-3 py-2 mb-1"
              >
                <option value="">-- Choose a set --</option>
                {mySets.map((s) => (
                  <option key={s._id} value={s._id}>{s.title} ({s.cards?.length || 0} terms)</option>
                ))}
              </select>

              <label className="block text-sm font-medium mb-1">Mode</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2">
                  <input type="radio" name="mode" value="test" checked={createForm.mode === 'test'} onChange={(e) => setCreateForm({ ...createForm, mode: e.target.value })}/>
                  <span>Test (multiple choice)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="mode" value="learn" checked={createForm.mode === 'learn'} onChange={(e) => setCreateForm({ ...createForm, mode: e.target.value })}/>
                  <span>Learn (typed answer)</span>
                </label>
              </div>

              <label className="block text-sm font-medium mb-1">Deadline</label>
              <input
                type="datetime-local"
                value={createForm.deadline}
                onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                className="w-full border rounded px-3 py-2 mb-4"
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2">Cancel</button>
                <button onClick={createAssignment} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Create</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Each question has 30s. Total time = 30s × number of questions.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
