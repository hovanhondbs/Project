import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBook, FaRegClone, FaChalkboardTeacher } from 'react-icons/fa';

function Sidebar() {
  const location = useLocation();
  const userRole = localStorage.getItem('userRole'); // 👈 lấy vai trò hiện tại

  // Tự xác định route đúng cho "Home" theo vai trò
  const homePath = userRole === 'Teacher' ? '/dashboard-teacher' : '/dashboard-user';
  const isHomeActive = location.pathname === homePath;

  return (
    <aside className="w-60 bg-white p-4">
      <h1 className="text-blue-600 text-2xl font-bold mb-8">FlashCard</h1>
      <nav className="space-y-1 text-gray-700">
        {/* Home */}
        <Link
          to={homePath}
          className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${
            isHomeActive
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <div
            className={`p-2 rounded-full ${
              isHomeActive ? 'bg-blue-600 text-white' : ''
            }`}
          >
            <FaHome />
          </div>
          Home
        </Link>

        {/* Library */}
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

        {/* Flashcards */}
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
{userRole === 'Teacher' && (
  <Link
    to="/create-class"
    className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium ${
      location.pathname === '/create-class'
        ? 'bg-yellow-100 text-yellow-700'
        : 'hover:bg-yellow-50 hover:text-yellow-700'
    }`}
  >
    <div
      className={`p-2 rounded-full ${
        location.pathname === '/create-class' ? 'bg-yellow-600 text-white' : ''
      }`}
    >
      <FaChalkboardTeacher />
    </div>
    Create Class
  </Link>
)}


        
      </nav>
    </aside>
  );
}

export default Sidebar;
