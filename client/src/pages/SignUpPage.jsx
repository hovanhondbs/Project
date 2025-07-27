import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User'
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', form);

      // Đăng nhập tự động sau khi đăng ký
      const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: form.email,
        password: form.password
      });

      const { token, user } = loginRes.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      alert('Sign up successful!');
      navigate('/choose-role');
    } catch (err) {
      alert(err.response?.data?.message || 'Sign up failed');
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
            <span className="border-b-2 border-purple-400 text-gray-900 mr-6">Sign up</span>
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-black">
              Log in
            </button>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded bg-gray-50"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded bg-gray-50"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded bg-gray-50"
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUpPage;
