// src/pages/ClassroomDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import UserMenu from '../components/UserMenu';
import EditClassButton from '../components/EditClassButton';
import DeleteClassButton from '../components/DeleteClassButton';
import ShareClassButton from '../components/ShareClassButton';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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

  const userId = localStorage.getItem('userId');

  const fetchClass = async () => {
    const res = await axios.get(`${API}/api/classrooms/${id}`);
    setClassData(res.data);
    return res.data;
  };

  const fetchUser = async () => {
    if (!userId) return null;
    const res = await axios.get(`${API}/api/user/${userId}`);
    setUserData(res.data);
    return res.data;
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchUser(), fetchClass()]);
      setLoading(false);
    })().catch(console.error);
  }, [id]);

  // mark pending for student
  useEffect(() => {
    if (!classData || !userId) return;
    const mine = (classData.joinRequests || []).find(
      r => (r.student?._id || r.student)?.toString() === userId && r.status === 'pending'
    );
    setPending(!!mine);
  }, [classData, userId]);

  // bell badge for teacher
  useEffect(() => {
    if (!userData || !classData) return;
    const isTeacher = userData._id === classData.createdBy._id;
    if (!isTeacher) return;
    axios.get(`${API}/api/classrooms/pending-count/${userData._id}`)
      .then(r => setBell(r.data?.count || 0))
      .catch(() => setBell(0));
  }, [userData, classData]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (loading || !classData || !userData) return <div className="p-10">Loading...</div>;

  const isTeacher = userData._id === classData.createdBy._id;
  const isStudent = userData.role === 'User';
  const alreadyJoined = classData.students.some(s => s._id === userData._id);
  const canSeeTabs = isTeacher || alreadyJoined;

  // student requests to join (approval needed)
  const requestJoin = async () => {
    try {
      await axios.post(`${API}/api/classrooms/${id}/request-join`, { studentId: userData._id });
      setPending(true);
      await fetchClass();
    } catch {
      alert('Error sending join request.');
    }
  };

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
        <div className="bg-white shadow rounded-lg p-6 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-green-700 mb-1">{classData.name}</h2>
            <p className="text-sm text-gray-600">Teacher: {classData.createdBy.username}</p>
          </div>

          {isTeacher ? (
            <div className="flex gap-3">
              <EditClassButton classData={classData} onUpdate={fetchClass} />
              <DeleteClassButton classId={id} onDeleteSuccess={() => navigate('/library')} />
              <ShareClassButton classId={id} />
            </div>
          ) : (
            isStudent && !alreadyJoined && (
              pending ? (
                <button disabled className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-semibold cursor-not-allowed">
                  Pending approval
                </button>
              ) : (
                <button onClick={requestJoin} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold">
                  Join Class
                </button>
              )
            )
          )}
        </div>

        {/* Tabs: HIDDEN until student joined */}
        {canSeeTabs ? (
          <>
            <div className="mb-6 border-b border-gray-300">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`pb-2 font-medium ${activeTab === 'assignments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  Assignments
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`pb-2 font-medium ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`pb-2 font-medium ${activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  Results
                </button>
              </nav>
            </div>

            <div>
              {activeTab === 'assignments' && <p className="text-gray-500">No assignments yet.</p>}
              {activeTab === 'members' && (
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {classData.students.map((s) => <li key={s._id}>{s.username}</li>)}
                </ul>
              )}
              {activeTab === 'results' && <p className="text-gray-500">Tracking feature will be updated soon.</p>}
            </div>
          </>
        ) : (
          <div className="text-gray-500 italic">
            You need to join the class to see assignments and members.
          </div>
        )}
      </main>
    </div>
  );
}
