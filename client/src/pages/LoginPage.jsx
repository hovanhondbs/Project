import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password,
    });

    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id);

    // ✅ gọi thêm để lấy vai trò thực tế
    const info = await axios.get(`http://localhost:5000/api/user/${user.id}`);
    localStorage.setItem('userRole', info.data.role);

    alert('Login successful!');
    const path = info.data.role === 'Teacher' ? '/dashboard-teacher' : '/dashboard-user';
    navigate(path);
  } catch (err) {
    alert(err.response?.data?.message || 'Login failed');
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
            <button onClick={() => navigate('/signup')} className="text-gray-400 hover:text-black mr-6">Sign up</button>
            <span className="border-b-2 border-purple-400 text-gray-900">Log in</span>
          </div>
          <button className="w-full py-2 border rounded-full flex items-center justify-center gap-2 text-sm hover:bg-gray-50 mb-6">
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
              onChange={e => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: false }));
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
              onChange={e => {
                setPassword(e.target.value);
                setErrors(prev => ({ ...prev, password: false }));
              }}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 text-sm ${
                errors.password ? 'border-red-500' : ''
              }`}
              placeholder="Enter your password"
            />
            <div className="text-right mt-1 text-sm">
              <button className="text-blue-600 hover:underline" onClick={() => alert('Tính năng chưa hỗ trợ')}>
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

        {/* Footer */}
        <p className="text-sm text-gray-500 mt-6 text-center">
          By logging in, you accept our
          <button className="underline text-blue-600 ml-1" onClick={() => alert('Xem Terms')}>Terms</button>
          &
          <button className="underline text-blue-600 ml-1" onClick={() => alert('Xem Privacy')}>Privacy</button>.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
