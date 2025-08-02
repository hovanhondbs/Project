import React from 'react';
import { FaBell, FaTrophy, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import avatarImage from '../assets/icon/20250730_2254_image.png';

function UserMenu({ avatarRef, dropdownOpen, setDropdownOpen, userData, loading, handleLogout }) {
  return (
    <div className="flex items-center gap-4 ml-4 relative">
      <FaBell className="text-xl text-gray-500 hover:text-blue-600 cursor-pointer" />
      <div className="relative" ref={avatarRef}>
        <img
          src={userData?.avatar || avatarImage}
          alt="User avatar"
          className="w-14 h-14 rounded-full border-2 border-gray-300 cursor-pointer"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        />
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
            <div className="px-4 py-3 border-b">
              {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : (
                <>
                  <p className="font-semibold text-sm">{userData?.username}</p>
                  <p className="text-xs text-gray-500">{userData?.email}</p>
                </>
              )}
            </div>
            <ul className="text-sm text-gray-700">
              <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                <Link to="/achievements" className="flex items-center gap-2 w-full h-full">
                  <FaTrophy /> Achievements
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"><FaCog /> Settings</li>
              <li onClick={handleLogout} className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"><FaSignOutAlt /> Log out</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserMenu;
