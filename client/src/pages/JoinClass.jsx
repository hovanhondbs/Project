import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function JoinClass() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');

  // Nếu chưa login → redirect to /login
  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  // Lấy thông tin user và lớp
  useEffect(() => {
    if (!userId || !classId) return;

    const fetchData = async () => {
      try {
        const [userRes, classRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/user/${userId}`),
          axios.get(`http://localhost:5000/api/classrooms/${classId}`)
        ]);

        setUserData(userRes.data);
        setClassData(classRes.data);
      } catch (err) {
        console.error(err);
        setError("Class not found or user error.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, classId]);

  const handleJoin = async () => {
    try {
      await axios.post(`http://localhost:5000/api/classrooms/${classId}/join`, {
        studentId: userId
      });
      setJoined(true);
    } catch (err) {
      console.error(err);
      setError("Failed to join class.");
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;

  // Nếu user là giáo viên thì không cho tham gia lớp
  if (userData?.role === 'Teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Teachers are not allowed to join other classes.
          </h2>
          <button
            onClick={() => navigate('/library')}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-green-700 mb-2">{classData.name}</h2>
        <p className="text-sm text-gray-600 mb-4">Teacher: {classData.createdBy.username}</p>
        <p className="text-gray-700 mb-6">{classData.description}</p>

        {joined ? (
          <div className="text-blue-600 font-medium mb-4">You have joined this class.</div>
        ) : (
          <button
            onClick={handleJoin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Join Class
          </button>
        )}

        <button
          onClick={() => navigate('/library')}
          className="w-full mt-3 text-sm text-gray-500 hover:underline"
        >
          Go to Your Library
        </button>
      </div>
    </div>
  );
}

export default JoinClass;
