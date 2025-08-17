import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import UserMenu from '../../components/UserMenu';
import {
  ResponsiveContainer,
  AreaChart, Area,
  Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function AdminDashboard() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSets: 0,
    openReports: 0,
  });

  const [days, setDays] = useState(30);
  const [series, setSeries] = useState([]);
  const [tsLoading, setTsLoading] = useState(false);

  // load me
  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (!id) {
      setLoading(false);
      return;
    }
    axios.get(`${API}/api/user/${id}`)
      .then((r) => setMe(r.data))
      .finally(() => setLoading(false));
  }, []);

  // overview stats
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API}/api/admin/stats/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setStats(r.data || {}))
      .catch(() => {});
  }, []);

  // time-series (stable callback)
  const fetchSeries = useCallback(async (d) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setTsLoading(true);
      const r = await axios.get(`${API}/api/admin/stats/timeseries`, {
        params: { days: d },
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (r.data?.series || []).map((row) => ({
        date: row.date,
        'New users': row.newUsers,
        'Cards created': row.cards,
        DAU: row.dau,
      }));
      setSeries(data);
    } catch {
      setSeries([]);
    } finally {
      setTsLoading(false);
    }
  }, []);

  // initial load 30 days
  useEffect(() => {
    fetchSeries(30);
  }, [fetchSeries]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // bỏ qua year để không tạo biến không dùng
  const fmtDate = (s) => {
    const [, m, d] = s.split('-'); // yyyy-mm-dd
    return `${d}/${m}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <UserMenu
            avatarRef={{ current: null }}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            userData={me}
            loading={loading}
            handleLogout={handleLogout}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card title="Users" value={stats.totalUsers} />
          <Card title="Teachers" value={stats.totalTeachers} />
          <Card title="Classes" value={stats.totalClasses} />
          <Card title="Sets" value={stats.totalSets} />
          <Card title="Open reports" value={stats.openReports} />
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Usage over time</h2>
            <div className="flex gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDays(d); fetchSeries(d); }}
                  className={`px-3 py-1.5 rounded border text-sm ${
                    days === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDate} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="New users" stroke="#3b82f6" fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="Cards created" stroke="#10b981" fill="url(#colorCards)" />
                <Line type="monotone" dataKey="DAU" stroke="#ef4444" dot={false} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {tsLoading && <div className="text-sm text-gray-500 mt-2">Loading…</div>}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
          <div className="flex gap-3">
            <a
              href="/admin/users"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Manage users
            </a>
            <a
              href="/admin/reports"
              className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
            >
              Review reports
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-1">{value ?? 0}</p>
    </div>
  );
}
