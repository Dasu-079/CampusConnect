import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../api/axios';
import { KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ForcePasswordChange() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      // Update local storage so that ProtectedRoute lets us pass
      user.isPasswordTemp = false;
      localStorage.setItem('user', JSON.stringify(user));

      setSuccess(true);
      setTimeout(() => {
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'TEACHER') navigate('/teacher');
        else if (user.role === 'STUDENT') navigate('/student');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-brand-100 p-3 rounded-full text-brand-600 mb-3">
            <KeyRound className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Secure Your Account</h2>
          <p className="text-slate-500 text-sm text-center mt-1">
            Since this is your first login, please update your default password to continue.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-green-200">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>Password updated successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Current/Default Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="Enter temporary password"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="Enter secure new password"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="Confirm secure new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition duration-150 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Updating...' : 'Update Password & Access Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
