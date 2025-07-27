import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate(); // 👈 hook điều hướng
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 shadow bg-white">
        <div className="text-2xl font-bold text-blue-600">Flashcard</div>
        <div className="flex gap-4 items-center">
          <button 
          onClick={() => navigate('/login')}
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Log in</button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex flex-col md:flex-row items-center justify-center px-6 py-12 gap-8">
        {/* Left content */}
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Ghi nhớ dễ hơn, học nhanh hơn cùng Flashcard!</h1>
          <p className="text-gray-600 mb-6">
            Flashcard là công cụ học từ vựng và kiến thức được thiết kế để giúp bạn ghi nhớ hiệu quả hơn, tiết kiệm thời gian và học tập một cách thông minh.
          </p>
          <ul className="text-gray-700 space-y-2 text-sm list-disc pl-6">
            <li>Học linh hoạt trên mọi nền tảng web</li>
            <li>Giao diện đơn giản, dễ dùng, tập trung vào việc ghi nhớ</li>
            <li>Phù hợp cho cả học sinh, sinh viên và người đi làm</li>
          </ul>
        </div>

        {/* Right QR / image */}
        <div className="flex flex-col items-center ">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://flashapp.com"
            alt="QR Code"
            className="mb-4"
          />
          <div className="flex gap-4">
            <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-10" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-10" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
