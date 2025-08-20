import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const load = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      setErr('');
      const r = await axios.get(`${API}/api/admin/users`, {
        params: { page: p, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(r.data?.items || []);
      setPage(r.data?.page || 1);
      setPages(r.data?.pages || 1);
      setTotal(r.data?.total || 0);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Load failed';
      setErr(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(1); }, [load]); // mount

  const updateStatus = async (id, status, opts = {}) => {
    try {
      await axios.patch(
        `${API}/api/admin/users/${id}/status`,
        { status, ...opts },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await load(page);
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Action failed');
    }
  };

  const handleSuspend = (u) => {
    const reason = window.prompt(
      `Nhập lý do treo tài khoản cho "${u.username}" (sẽ gửi vào email):`,
      'Vi phạm nội dung / Điều khoản sử dụng'
    );
    if (reason === null) return; // cancel
    if (!window.confirm(`Xác nhận treo và ẩn toàn bộ set của "${u.username}"?`)) return;
    updateStatus(u._id, 'suspended', { hideSets: true, reason });
  };

  const handleActivate = (u) => {
    if (!window.confirm(`Kích hoạt lại tài khoản "${u.username}"?`)) return;
    updateStatus(u._id, 'active'); // nếu muốn tự unhide set: { unhideSets: true }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Users</h1>
        <div className="text-sm text-gray-600">Total: {total}</div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Joined</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-6 text-gray-500" colSpan={6}>Loading…</td></tr>
            )}
            {!loading && err && (
              <tr><td className="p-6 text-red-600" colSpan={6}>{err}</td></tr>
            )}
            {!loading && !err && items.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3 font-medium">{u.username}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <span className={
                    `px-2 py-0.5 rounded text-xs ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' :
                      u.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`
                  }>
                    {u.status || 'active'}
                  </span>
                </td>
                <td className="p-3">{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                <td className="p-3">
                  {u.status !== 'suspended' ? (
                    <button
                      onClick={() => handleSuspend(u)}
                      className="px-3 py-1.5 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(u)}
                      className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && !err && items.length === 0 && (
              <tr><td className="p-6 text-gray-500" colSpan={6}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => load(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1 text-sm text-gray-600">Page {page}/{pages}</span>
        <button
          onClick={() => load(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
