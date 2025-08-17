// client/src/pages/admin/AdminReports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const REASON_MAP = {
  incorrect_content: 'Incorrect content',
  child_safety: 'Child safety / exploitation risk',
  adult_content: 'Adult / 18+ content',
  spam_or_ads: 'Spam or advertising',
};

export default function AdminReports() {
  const token = localStorage.getItem('token');
  const [status, setStatus] = useState('open'); // open|resolved|dismissed|all
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/reports/admin/list`, {
        headers,
        params: { status, page, limit },
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function getSet(r) {
    // tương thích cả 2 dạng API: targetSet (mới) | set (cũ)
    return r.targetSet || r.set || {};
  }
  function getReporter(r) {
    return r.reporter || {};
  }
  function getReason(r) {
    return r.reason || r.reasonCode || '';
  }

  async function resolve(reportId, action) {
    const msgMap = {
      delete: 'Delete this set and resolve report?',
      hide: 'Hide this set (soft action) and resolve report?',
      dismiss: 'Dismiss this report as invalid?',
    };
    if (!window.confirm(msgMap[action] || 'Proceed?')) return;

    const note = window.prompt(`Admin note for ${action} (optional):`, '') || '';
    try {
      await axios.post(
        `${API}/api/reports/${reportId}/resolve`,
        { action, note },
        { headers: { ...headers, 'Content-Type': 'application/json' } }
      );
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Resolve failed');
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">Reports</h1>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="border rounded px-2 py-1"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <span>Total:</span>
          <span className="font-medium">{total}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Set</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reporter</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reason</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Details</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No items
                </td>
              </tr>
            )}

            {!loading &&
              items.map((r) => {
                const set = getSet(r);
                const rep = getReporter(r);
                const reason = getReason(r);
                const setLink = set._id ? `/flashcards/${set._id}` : '#';

                return (
                  <tr key={r._id} className="border-t">
                    <td className="px-4 py-3 text-sm">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium truncate max-w-xs">
                        {set.title || '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID:&nbsp;{set._id || '—'} &nbsp;|&nbsp;
                        <a
                          href={setLink}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">
                        {rep.username || rep.email || '—'}
                      </div>
                      <div className="text-xs text-gray-500">ID: {rep._id || '—'}</div>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {REASON_MAP[reason] || reason || '—'}
                    </td>

                    <td className="px-4 py-3 text-sm max-w-md break-words">
                      {r.details || '—'}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded bg-gray-100">
                        {r.status}
                        {r.action ? ` / ${r.action}` : ''}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {r.status === 'open' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => resolve(r._id, 'delete')}
                            className="px-3 py-1 rounded bg-red-600 text-white"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => resolve(r._id, 'hide')}
                            className="px-3 py-1 rounded bg-yellow-500 text-white"
                          >
                            Hide
                          </button>
                          <button
                            onClick={() => resolve(r._id, 'dismiss')}
                            className="px-3 py-1 rounded border"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-gray-400">—</div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page}/{totalPages}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">
            Per page:&nbsp;
            <select
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(parseInt(e.target.value, 10));
              }}
              className="border rounded px-2 py-1"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

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
