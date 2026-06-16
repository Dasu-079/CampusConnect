import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);

  // Enforce first-time password reset policy
  if (user.isPasswordTemp) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard based on role if they try to access unauthorized pages
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
