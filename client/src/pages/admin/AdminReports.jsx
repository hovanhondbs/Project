import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const REASONS = {
  incorrect_content: 'Incorrect content',
  child_safety: 'Child safety / exploitation risk',
  adult_content: 'Adult / 18+ content',
  spam_or_ads: 'Spam or advertising',
};

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/reports/admin/list`, {
        headers,
        params: { page, limit, status },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('Fetch reports failed:', e?.response?.data || e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const renderReason = (code) => REASONS[code] || code;

  const handleResolve = async (reportId, actionLabel) => {
    const action = actionLabel; // 'delete' | 'hide' | 'dismiss'
    const note = window.prompt(
      action === 'delete'
        ? 'Optional note to the set owner (why this set is removed):'
        : action === 'hide'
        ? 'Optional note to the set owner (why this set is hidden):'
        : 'Optional note to the reporter (why this report is dismissed):',
      ''
    );
    if (note === null) return;

    try {
      await axios.post(
        `${API}/api/reports/${reportId}/resolve`,
        { action, note },
        { headers }
      );
      await fetchData();
      alert(
        action === 'delete'
          ? 'Removed set & resolved.'
          : action === 'hide'
          ? 'Hidden set & resolved.'
          : 'Dismissed report.'
      );
    } catch (e) {
      console.error(e?.response?.data || e);
      alert('Failed to update report.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Reports</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            className="border rounded px-2 py-1"
          >
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Set</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reporter</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reason</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                  No reports.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="px-4 py-3 text-sm">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{r?.targetSet?.title || '(deleted set)'}</div>
                    <div className="text-xs text-gray-500">
                      ID: {r?.targetSet?._id || r.targetSet}
                      {r?.targetSet?._id && (
                        <>
                          {' · '}
                          {/* Sang trang preview mới */}
                          <Link
                            to={`/admin/reports/preview/${r.targetSet._id}`}
                            className="text-blue-600 hover:underline"
                            title="Preview set (admin)"
                          >
                            View
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{r?.reporter?.username || '(unknown)'}</div>
                    <div className="text-xs text-gray-500">{r?.reporter?.email || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{renderReason(r.reason)}</td>
                  <td className="px-4 py-3 text-sm">{r.status}</td>
                  <td className="px-4 py-3">
                    {r.status === 'open' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResolve(r._id, 'delete')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleResolve(r._id, 'dismiss')}
                          className="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-xs text-gray-500">
                        {r.action ? `Action: ${r.action}` : '—'}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Page {page} / {totalPages} • Total {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-2 rounded border disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-2 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
