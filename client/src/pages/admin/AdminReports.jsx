import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function AdminReports() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const token = localStorage.getItem('token');
    const r = await axios.get(`${API}/api/reports?status=open`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(()=>({data:{items:[]}}));
    setItems(r.data?.items || []);
  };

  const act = async (id, action) => {
    const token = localStorage.getItem('token');
    await axios.patch(`${API}/api/reports/${id}/resolve`, { action }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reported Sets</h1>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="bg-gray-50">
            <th className="text-left p-3">Set</th>
            <th className="text-left p-3">Reporter</th>
            <th className="text-left p-3">Reason</th>
            <th className="text-left p-3">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(r=>(
              <tr key={r._id} className="border-t">
                <td className="p-3">{r.targetSet?.title || '(deleted)'}</td>
                <td className="p-3">{r.reporter?.username || '-'}</td>
                <td className="p-3">{r.reason || '-'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={()=>act(r._id,'dismiss')} className="px-3 py-1.5 border rounded">Dismiss</button>
                  <button onClick={()=>act(r._id,'hide')} className="px-3 py-1.5 border rounded text-yellow-700 border-yellow-300">Hide</button>
                  <button onClick={()=>act(r._id,'delete')} className="px-3 py-1.5 border rounded text-red-700 border-red-300">Delete</button>
                </td>
              </tr>
            ))}
            {items.length===0 && <tr><td className="p-6 text-gray-500" colSpan={4}>No open reports.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
