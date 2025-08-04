import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import UserMenu from '../components/UserMenu';
import EditClassButton from '../components/EditClassButton';
import DeleteClassButton from '../components/DeleteClassButton';
import ShareClassButton from '../components/ShareClassButton';

function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assignments");

  const storedUserId = localStorage.getItem("userId");

  const fetchClassDataLai = () => {
    axios.get(`http://localhost:5000/api/classrooms/${id}`)
      .then(res => setClassData(res.data))
      .catch(err => console.error("Failed to fetch classroom info", err));
  };

  useEffect(() => {
    if (!storedUserId) return;

    axios.get(`http://localhost:5000/api/user/${storedUserId}`)
      .then(res => setUserData(res.data))
      .catch(err => console.error("Failed to fetch user info", err));
  }, [storedUserId]);

  useEffect(() => {
    fetchClassDataLai();
    setLoading(false);
  }, [id]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading || !classData || !userData) return <div className="p-10">Loading...</div>;

  const isTeacher = userData._id === classData.createdBy._id;

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
          />
        </div>

        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-green-700 mb-1">{classData.name}</h2>
            <p className="text-sm text-gray-600">Teacher: {classData.createdBy.username}</p>
          </div>

          {isTeacher && (
            <div className="flex gap-3">
              <EditClassButton classData={classData} onUpdate={fetchClassDataLai} />
              <DeleteClassButton classId={id} onDeleteSuccess={() => navigate('/library')} />
              <ShareClassButton classId={id} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-300">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab("assignments")}
              className={`pb-2 font-medium ${activeTab === "assignments" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`pb-2 font-medium ${activeTab === "members" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`pb-2 font-medium ${activeTab === "results" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
            >
              Results
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "assignments" && (
            <p className="text-gray-500">No assignments yet.</p>
          )}

          {activeTab === "members" && (
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {classData.students.map((s) => (
                <li key={s._id}>{s.username}</li>
              ))}
            </ul>
          )}

          {activeTab === "results" && (
            <p className="text-gray-500">Tracking feature will be updated soon.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default ClassroomDetail;
