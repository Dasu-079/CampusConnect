import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Inline ForcePasswordChange page to ensure complete flow is self-contained
import ForcePasswordChange from './pages/ForcePasswordChange.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ForcePasswordChange />} />

        {/* Admin Portal */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher Portal */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Portal */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch All Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
