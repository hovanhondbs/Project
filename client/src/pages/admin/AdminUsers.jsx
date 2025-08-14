import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function AdminUsers() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const token = localStorage.getItem('token');
    const r = await axios.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(()=>({data:{items:[]}}));
    setItems(r.data?.items || []);
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">User Management</h1>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="bg-gray-50">
            <th className="text-left p-3">Username</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Role</th>
            <th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {items.map(u=>(
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.status}</td>
              </tr>
            ))}
            {items.length===0 && <tr><td className="p-6 text-gray-500" colSpan={4}>No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
