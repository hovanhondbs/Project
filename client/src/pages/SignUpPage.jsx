// src/pages/SignUpPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// ✅ Cho phép chữ Unicode có dấu + số + "." + "_" + khoảng trắng; 3–20 ký tự
const USERNAME_REGEX = /^[\p{L}\p{M}\p{N}._ ]{3,20}$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignUpPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onChange',
    defaultValues: { username: '', email: '', password: '', role: 'User' },
  });

  const username = watch('username');
  const email = watch('email');
  const password = watch('password');
  const role = watch('role');

  const [checkingU, setCheckingU] = useState(false);
  const [availU, setAvailU] = useState(null);
  const [checkingE, setCheckingE] = useState(false);
  const [availE, setAvailE] = useState(null);

  // Debounce USERNAME
  useEffect(() => {
    if (!username) { setAvailU(null); return; }
    const t = setTimeout(async () => {
      const u = (username || '').trim();
      if (!USERNAME_REGEX.test(u)) { setAvailU(null); return; }
      try {
        setCheckingU(true);
        const res = await axios.get(`${API_BASE}/api/auth/check-username`, { params: { username: u } });
        setAvailU(!!res.data?.available);
        if (res.data?.available) clearErrors('username');
        else setError('username', { type: 'manual', message: 'Username is taken' });
      } catch {
        setAvailU(null);
      } finally {
        setCheckingU(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username, clearErrors, setError]);

  // Debounce EMAIL
  useEffect(() => {
    if (!email) { setAvailE(null); return; }
    const t = setTimeout(async () => {
      const e = (email || '').trim();
      if (!EMAIL_REGEX.test(e)) { setAvailE(null); return; }
      try {
        setCheckingE(true);
        const res = await axios.get(`${API_BASE}/api/auth/check-email`, { params: { email: e } });
        setAvailE(!!res.data?.available);
        if (res.data?.available) clearErrors('email');
        else setError('email', { type: 'manual', message: 'Email is already in use' });
      } catch {
        setAvailE(null);
      } finally {
        setCheckingE(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [email, clearErrors, setError]);

  // Strength
  const pwdStrength = useMemo(() => {
    const len = (password || '').length >= 8;
    const letter = /[A-Za-z]/.test(password || '');
    const num = /\d/.test(password || '');
    const score = [len, letter, num].filter(Boolean).length;
    return { score, len, letter, num };
  }, [password]);

  const onSubmit = async (data) => {
    if (availU === false) { setError('username', { type: 'manual', message: 'Username is taken' }); return; }
    if (availE === false) { setError('email', { type: 'manual', message: 'Email is already in use' }); return; }

    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        username: data.username.trim(), // giữ khoảng trắng giữa từ, cắt đầu/đuôi
        email: data.email.trim(),
        password: data.password,
        role: role || 'User',
      });
      const { token, user } = res.data || {};
      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userId', user.id || user._id);
      }
      alert('Sign up successful!');
      navigate('/choose-role');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Sign up failed';
      if (/username/i.test(msg)) setError('username', { type: 'server', message: msg });
      else if (/email/i.test(msg)) setError('email', { type: 'server', message: msg });
      else setError('password', { type: 'server', message: msg });
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-white px-4 relative">
      <button
        className="absolute top-4 right-4 text-xl text-gray-400 hover:text-black"
        onClick={() => navigate('/')}
      >
        ×
      </button>

      <div className="w-full max-w-md p-8 shadow rounded-lg">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4 text-lg font-semibold">
            <span className="border-b-2 border-purple-400 text-gray-900 mr-6">Sign up</span>
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-black">
              Log in
            </button>
          </div>
          <button
            className="w-full py-2 border rounded-full flex items-center justify-center gap-2 text-sm hover:bg-gray-50 mb-6"
            type="button"
          >
            <img src="https://img.icons8.com/color/20/google-logo.png" alt="Google" />
            Continue with Google
          </button>
          <div className="flex items-center justify-between mb-4">
            <hr className="w-1/3 border-gray-300" />
            <span className="text-sm text-gray-500">or email</span>
            <hr className="w-1/3 border-gray-300" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-sm text-gray-700">Username</label>
            <input
              type="text"
              {...register('username', {
                required: 'Username is required',
                validate: {
                  format: (v) =>
                    USERNAME_REGEX.test((v || '').trim()) ||
                    '3–20 ký tự, cho phép chữ tiếng Việt, khoảng trắng, dấu chấm và gạch dưới',
                },
                onChange: () => setAvailU(null),
              })}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 ${
                errors.username ? 'border-red-500' : ''
              }`}
              placeholder="John Doe"
              autoComplete="off"
            />
            <div className="mt-1 text-xs">
              {checkingU && <span className="text-gray-500">Checking availability…</span>}
              {!checkingU && availU === true && <span className="text-green-600">Username is available</span>}
              {!checkingU && availU === false && <span className="text-red-600">Username is taken</span>}
              {errors.username && <div className="text-red-600">{errors.username.message}</div>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                validate: { format: (v) => EMAIL_REGEX.test((v || '').trim()) || 'Invalid email' },
                onChange: () => setAvailE(null),
              })}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="you@example.com"
              autoComplete="off"
            />
            <div className="mt-1 text-xs">
              {checkingE && <span className="text-gray-500">Checking…</span>}
              {!checkingE && availE === true && <span className="text-green-600">Email is available</span>}
              {!checkingE && availE === false && <span className="text-red-600">Email is already in use</span>}
              {errors.email && <div className="text-red-600">{errors.email.message}</div>}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-700">Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                validate: {
                  len: (v) => (v || '').length >= 8 || 'At least 8 characters',
                  letter: (v) => /[A-Za-z]/.test(v || '') || 'Must include a letter',
                  number: (v) => /\d/.test(v || '') || 'Must include a number',
                },
              })}
              className={`w-full mt-1 px-3 py-2 border rounded bg-gray-50 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <div className="text-xs mt-1">
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded ${pwdStrength.len ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>8+ chars</span>
                <span className={`px-2 py-0.5 rounded ${pwdStrength.letter ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>letter</span>
                <span className={`px-2 py-0.5 rounded ${pwdStrength.num ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>number</span>
              </div>
              {errors.password && <div className="text-red-600 mt-1">{errors.password.message}</div>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing up…' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
}
