import React, { useState, useRef } from 'react';
import { FaBell, FaTrophy, FaCog, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import avatarImage from '../assets/icon/20250730_2254_image.png';
import axios from 'axios';
// Import trực tiếp các ảnh avatar
import avatar1 from '../assets/image/avatar1.jpeg';
import avatar2 from '../assets/image/avatar2.jpeg';
import avatar3 from '../assets/image/avatar3.jpeg';
import avatar4 from '../assets/image/avatar4.jpeg';
import avatar5 from '../assets/image/avatar5.jpeg';

function UserMenu({ avatarRef, dropdownOpen, setDropdownOpen, userData, loading, handleLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState(userData?.username || '');
  const [avatar, setAvatar] = useState(userData?.avatar || avatarImage);
  const fileInputRef = useRef();

  // Sửa lại đường dẫn ảnh avatar theo đúng cấu trúc thư mục của bạn
  const suggestedAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      
      if (fileInputRef.current?.files[0]) {
        formData.append('avatar', fileInputRef.current.files[0]);
      }

      await axios.put(`/api/user/${userData._id}`, formData);
      setShowSettings(false);
      window.location.reload();
    } catch (err) {
      console.error("Update error:", err);
    }
  };
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
              <li 
                className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                onClick={() => setShowSettings(true)}
              >
                <FaCog /> Settings
              </li>
              <li onClick={handleLogout} className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                <FaSignOutAlt /> Log out
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Settings Popup */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button onClick={() => setShowSettings(false)}>
                <FaTimes className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Avatar Selection */}
              <div>
                <label className="block mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-xs">Upload</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {suggestedAvatars.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Avatar ${i+1}`}
                        className="w-10 h-10 rounded-full cursor-pointer hover:border-2 hover:border-blue-400"
                        onClick={() => setAvatar(img)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Username */}
              <div>
                <label className="block mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;