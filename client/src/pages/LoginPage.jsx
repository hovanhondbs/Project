// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleLogin = async () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = true;
    if (!password.trim()) newErrors.password = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // 1) login
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      const { token, user } = res.data || {};
      if (!token || !user) {
        alert('Login response invalid');
        return;
      }

      // 2) lưu cơ bản
      const uid = user.id || user._id;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (uid) localStorage.setItem('userId', uid);

      // 3) lấy role (ưu tiên role trả về từ login; nếu không có thì fetch /user/:id)
      let role = user.role;
      if (!role && uid) {
        try {
          const info = await axios.get(`${API}/api/user/${uid}`);
          role = info.data?.role || role;
        } catch {
          // ignore
        }
      }
      role = role || 'User';

      // 4) lưu role cho các guard/route khác dùng
      localStorage.setItem('role', role);
      localStorage.setItem('userRole', role);

      // 5) điều hướng theo role
      if (role === 'Admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'Teacher') {
        navigate('/dashboard-teacher', { replace: true });
      } else {
        navigate('/dashboard-user', { replace: true });
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-white px-4 relative">
      <button
        className="absolute top-4 right-4 text-xl text-gray-400 hover:text-black"
        onClick={() => navigate('/')}
      >
        &times;
      </button>

      <div className="w-full max-w-md p-8 shadow rounded-lg">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4 text-lg font-semibold">
            <button onClick={() => navigate('/signup')} className="text-gray-400 hover:text-black mr-6">
              Sign up
            </button>
            <span className="border-b-2 border-purple-400 text-gray-900">Log in</span>
          </div>
          <button
            className="w-full py-2 border rounded-full flex items-center justify-center gap-2 text-sm hover:bg-gray-50 mb-6"
            type="button"
            onClick={() => alert('Google login coming soon')}
          >
            <img src="https://img.icons8.com/color/20/google-logo.png" alt="Google" />
            Log in with Google
          </button>
          <div className="flex items-center justify-between mb-4">
            <hr className="w-1/3 border-gray-300" />
            <span className="text-sm text-gray-500">or email</span>
            <hr className="w-1/3 border-gray-300" />
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: false }));
              }}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 text-sm ${
                errors.email ? 'border-red-500' : ''
              }`}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: false }));
              }}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 text-sm ${
                errors.password ? 'border-red-500' : ''
              }`}
              placeholder="Enter your password"
            />
            <div className="text-right mt-1 text-sm">
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => alert('Tính năng chưa hỗ trợ')}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
