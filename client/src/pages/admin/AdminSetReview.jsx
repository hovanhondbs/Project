import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const abs = (src) => {
  if (!src) return '';
  const s = String(src).replace(/\\/g, '/').trim();
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  if (/^\/?uploads\//i.test(s)) return `${API}/${s.replace(/^\/+/, '')}`;
  return `${API}/${s.replace(/^\/+/, '')}`;
};

export default function AdminSetReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [setData, setSetData] = useState(null);
  const [err, setErr] = useState('');
  const [idx, setIdx] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      try {
        setErr('');
        const res = await axios.get(`${API}/api/admin-preview/flashcards/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSetData(res.data || null);
        setIdx(0);
      } catch (e) {
        const msg =
          e?.response?.status === 401 || e?.response?.status === 403
            ? 'You need admin permission to preview this set.'
            : e?.response?.status === 404
            ? 'Set not found or removed.'
            : 'Server error. Please try again.';
        setErr(msg);
      }
    };
    load();
  }, [id, token]);

  const card = setData?.cards?.[idx];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header đơn giản */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            Back
          </button>
          <h1 className="text-2xl font-bold">
            {setData?.title || 'Preview'}
          </h1>
        </div>

        {/* Link sang manage reports cho tiện điều hướng */}
        <Link
          to="/admin/reports"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Reports
        </Link>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {err && (
          <div className="p-4 rounded border border-red-200 bg-red-50 text-red-700">
            {err}
          </div>
        )}

        {!err && !setData && (
          <div className="text-center text-gray-500 py-20">Loading…</div>
        )}

        {setData && (
          <>
            {setData.description ? (
              <p className="mt-2 text-gray-500">{setData.description}</p>
            ) : null}

            {/* Viewer chỉ có thẻ – không có nút Report/StudyModes */}
            {setData.cards?.length ? (
              <>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIdx((i) => Math.max(0, i - 1))}
                    disabled={idx === 0}
                    className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    <FaArrowLeft />
                  </button>

                  <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8 text-center">
                    <p className="text-2xl font-semibold">{card?.term}</p>
                    {card?.image && (
                      <img
                        src={abs(card.image)}
                        alt="term"
                        className="mt-4 w-full h-48 object-contain"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    {/* mặt sau mô tả – nếu bạn muốn ẩn thì bỏ block này */}
                    {card?.definition && (
                      <p className="mt-4 text-gray-700">{card.definition}</p>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setIdx((i) => Math.min(i + 1, setData.cards.length - 1))
                    }
                    disabled={idx === setData.cards.length - 1}
                    className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    <FaArrowRight />
                  </button>
                </div>

                <p className="mt-4 text-center text-gray-500">
                  {idx + 1} / {setData.cards.length}
                </p>
              </>
            ) : (
              <div className="mt-10 text-gray-500">No cards in this set.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
