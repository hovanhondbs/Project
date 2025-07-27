import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    // Nếu chưa đăng nhập → chuyển về /login
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập → hiển thị nội dung bên trong
  return children;
}

export default PrivateRoute;
