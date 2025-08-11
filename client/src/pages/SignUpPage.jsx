import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'User' });
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null); // null | true | false

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    if (name === 'username') setAvailable(null);
  };

  // Debounced username availability check
  useEffect(() => {
    const t = setTimeout(async () => {
      const name = form.username.trim();
      if (!name || !USERNAME_REGEX.test(name)) return setAvailable(null);
      try {
        setChecking(true);
        const res = await axios.get(`${API_BASE}/api/auth/check-username`, { params: { username: name } });
        setAvailable(!!res.data?.available);
      } catch (_) {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.username]);

  const pwdStrength = useMemo(() => {
    const { password } = form;
    const len = password.length >= 8;
    const letter = /[a-zA-Z]/.test(password);
    const num = /\d/.test(password);
    const score = [len, letter, num].filter(Boolean).length;
    return { score, len, letter, num };
  }, [form.password]);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    else if (!USERNAME_REGEX.test(form.username.trim())) e.username = '3–20 letters, numbers, dot or underscore';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (!(pwdStrength.len && pwdStrength.letter && pwdStrength.num)) e.password = 'At least 8 chars incl. a letter and a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      // auto-login if your backend returns token like above
      const { token, user } = res.data;
      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userId', user.id);
      }

      alert('Sign up successful!');
      navigate('/choose-role');
    } catch (err) {
      const msg = err.response?.data?.message || 'Sign up failed';
      if (/username/i.test(msg)) setErrors((p) => ({ ...p, username: msg }));
      if (/email/i.test(msg)) setErrors((p) => ({ ...p, email: msg }));
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-white px-4 relative">
      <button className="absolute top-4 right-4 text-xl text-gray-400 hover:text-black" onClick={() => navigate('/')}>×</button>

      <div className="w-full max-w-md p-8 shadow rounded-lg">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4 text-lg font-semibold">
            <span className="border-b-2 border-purple-400 text-gray-900 mr-6">Sign up</span>
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-black">Log in</button>
          </div>
          <button className="w-full py-2 border rounded-full flex items-center justify-center gap-2 text-sm hover:bg-gray-50 mb-6">
            <img src="https://img.icons8.com/color/20/google-logo.png" alt="Google" />
            Continue with Google
          </button>
          <div className="flex items-center justify-between mb-4">
            <hr className="w-1/3 border-gray-300" />
            <span className="text-sm text-gray-500">or email</span>
            <hr className="w-1/3 border-gray-300" />
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={onChange}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 ${errors.username ? 'border-red-500' : ''}`}
              placeholder="your_username"
            />
            <div className="mt-1 text-xs">
              {checking && <span className="text-gray-500">Checking availability…</span>}
              {!checking && available === true && <span className="text-green-600">Username is available</span>}
              {!checking && available === false && <span className="text-red-600">Username is taken</span>}
              {errors.username && <div className="text-red-600">{errors.username}</div>}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="you@example.com"
            />
            {errors.email && <div className="text-red-600 text-xs mt-1">{errors.email}</div>}
          </div>

          <div>
            <label className="text-sm text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="At least 8 characters"
            />
            <div className="text-xs mt-1">
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded ${pwdStrength.len ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>8+ chars</span>
                <span className={`px-2 py-0.5 rounded ${pwdStrength.letter ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>letter</span>
                <span className={`px-2 py-0.5 rounded ${pwdStrength.num ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>number</span>
              </div>
              {errors.password && <div className="text-red-600 mt-1">{errors.password}</div>}
            </div>
          </div>

          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">Sign up</button>
        </form>
      </div>
    </div>
  );
}
