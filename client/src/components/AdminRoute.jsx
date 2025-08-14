import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Route guard: ưu tiên đọc role từ localStorage; nếu không có thì fetch theo userId
export default function AdminRoute({ children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role === 'Admin') return setOk(true);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return setOk(false);

    axios.get(`${API}/api/user/${userId}`)
      .then(r => setOk(r.data?.role === 'Admin'))
      .catch(() => setOk(false));
  }, []);

  if (ok === null) return <div className="p-10">Loading…</div>;
  if (!ok) return <Navigate to="/login" replace />;
  return children;
}
