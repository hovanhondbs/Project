import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBook, FaRegClone } from 'react-icons/fa';

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-white p-4">
      <h1 className="text-blue-600 text-2xl font-bold mb-8">FlashCard</h1>
      <nav className="space-y-1 text-gray-700">
        <Link
          to="/dashboard-user"
          className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${
            location.pathname === '/dashboard-user'
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <div
            className={`p-2 rounded-full ${
              location.pathname === '/dashboard-user' ? 'bg-blue-600 text-white' : ''
            }`}
          >
            <FaHome />
          </div>
          Home
        </Link>

        <Link
          to="/library"
          className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${
            location.pathname === '/library'
              ? 'bg-[#08D9AA] text-white'
              : 'hover:bg-[#08D9AA]/20 hover:text-[#08D9AA]'
          }`}
        >
          <div
            className={`p-2 rounded-full ${
              location.pathname === '/library' ? 'bg-white text-[#08D9AA]' : ''
            }`}
          >
            <FaBook />
          </div>
          Your Library
        </Link>

        <Link
          to="/flashcards"
          className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${
            location.pathname === '/flashcards'
              ? 'bg-[#8731EB] text-white'
              : 'hover:bg-[#8731EB]/20 hover:text-[#8731EB]'
          }`}
        >
          <div
            className={`p-2 rounded-full ${
              location.pathname === '/flashcards' ? 'bg-white text-[#8731EB]' : ''
            }`}
          >
            <FaRegClone />
          </div>
          Flashcards
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
