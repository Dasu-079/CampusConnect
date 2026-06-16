import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { GraduationCap, Lock, User, AlertCircle, RefreshCw } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear existing session on load
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.isPasswordTemp) {
        navigate('/change-password');
      } else {
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'TEACHER') navigate('/teacher');
        else if (user.role === 'STUDENT') navigate('/student');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please check your username/password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
      {/* Brand panel */}
      <div className="md:w-1/2 bg-brand-900 flex flex-col justify-between p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,106,191,0.2)_0%,rgba(12,61,107,0.8)_100%)] z-0" />
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-brand-500/10 blur-[120px]" />
        
        <div className="z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
            <GraduationCap className="h-8 w-8 text-brand-300" />
          </div>
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>

        <div className="my-auto z-10 max-w-lg mt-12 md:mt-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300 bg-brand-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
            Government Diploma College ERP
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mt-4 text-white">
            Centralized Management Portal
          </h1>
          <p className="text-slate-300 mt-4 text-base font-light leading-relaxed">
            Real-time academics tracking, attendance automation, result publication, and smart timetable coordination for students, staff, and administration.
          </p>
        </div>

        <div className="z-10 mt-12 md:mt-0 border-t border-white/10 pt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-400">
          <span>APSRTC Route Schedules Included</span>
          <span>Pragati & Post Matric Scholarships</span>
          <span>Branch-wise Resources</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Please enter your credentials to access the dashboard.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-950/40 border border-red-900/60 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Username / ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder-slate-600 text-sm transition"
                  placeholder="Reg No (Student) or Faculty ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder-slate-600 text-sm transition"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-500 transition duration-150 disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800 pt-6 text-center">
            <span className="text-xs text-slate-500">
              Only Administrator can create accounts. Student default password is registration number.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
