import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard, Calendar, BookOpen, Bus, Award, Volume2, User, LogOut,
  AlertTriangle, ExternalLink, Search, RefreshCw, KeyRound, Check
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  
  // Attendance & Results detailed data
  const [attendanceBreakdown, setAttendanceBreakdown] = useState([]);
  const [resultsList, setResultsList] = useState([]);
  
  // Resources & Utilities
  const [resources, setResources] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [routes, setRoutes] = useState([]);
  
  // Timetable
  const [timetable, setTimetable] = useState([]);
  
  // Search & Filter
  const [resourceSearch, setResourceSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [busTypeFilter, setBusTypeFilter] = useState('');

  // Profile Form States
  const [profileForm, setProfileForm] = useState({ email: '', mobile: '', profilePic: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  // Fetch all student data on load
  const fetchStudentData = async () => {
    try {
      const [dashRes, attRes, resRes, ttRes, resrcRes, scholRes, routeRes] = await Promise.all([
        api.get('/student/dashboard'),
        api.get('/student/attendance'),
        api.get('/student/results'),
        api.get('/student/timetable'),
        api.get('/student/resources'),
        api.get('/shared/scholarships'),
        api.get('/shared/routes'),
      ]);

      setDashboardData(dashRes.data);
      setAttendanceBreakdown(attRes.data.subjectWiseBreakdown);
      setResultsList(resRes.data);
      setTimetable(ttRes.data);
      setResources(resrcRes.data);
      setScholarships(scholRes.data);
      setRoutes(routeRes.data);

      if (dashRes.data.profile) {
        setProfileForm({
          email: dashRes.data.profile.email || '',
          mobile: dashRes.data.profile.mobile || '',
          profilePic: dashRes.data.profile.profilePic || '',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/student/profile', profileForm);
      alert('Profile contacts updated successfully.');
      fetchStudentData();
    } catch (err) {
      console.error(err);
      alert('Error updating profile contacts.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    const currentPwdInput = prompt('Enter your current password to confirm:');
    if (!currentPwdInput) return;

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: currentPwdInput,
        newPassword,
      });
      setPwdMsg({ type: 'success', text: 'Password changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Error updating password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Filtered lists
  const filteredResources = resources.filter(res =>
    res.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    res.subject.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    res.subject.code.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.destination.toLowerCase().includes(routeSearch.toLowerCase()) ||
      r.source.toLowerCase().includes(routeSearch.toLowerCase()) ||
      r.stops.toLowerCase().includes(routeSearch.toLowerCase());
    const matchesType = busTypeFilter === '' || r.busType === busTypeFilter;
    return matchesSearch && matchesType;
  });

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  const { profile, attendancePercentage, announcements, upcomingScholarships } = dashboardData;

  // Calculate SGPA metrics
  // total marks obtained vs max possible marks
  let totalObtained = 0;
  let totalPossible = 0;
  resultsList.forEach(r => {
    // Internals: 20, Assignments: 10, Labs: 50
    const subObtained = r.internalMarks + r.assignmentMarks + r.labMarks;
    const subMax = 30 + (r.labMarks > 0 ? 50 : 0); // internal (20) + assignment (10) + lab (if taken)
    totalObtained += subObtained;
    totalPossible += subMax;
  });
  const overallPercentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="h-16 flex items-center gap-3 px-6 bg-slate-950">
            <LayoutDashboard className="h-7 w-7 text-brand-400" />
            <span className="text-lg font-bold text-white tracking-tight">CampusConnect</span>
          </div>
          <div className="px-4 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Student Portal
          </div>
          <nav className="px-2 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'overview' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'attendance' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Check className="h-5 w-5" />
              <span>Attendance Tracker</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'results' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Award className="h-5 w-5" />
              <span>Academics & Marks</span>
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'timetable' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>My Timetable</span>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'resources' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span>Resource Center</span>
            </button>
            <button
              onClick={() => setActiveTab('transport')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'transport' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Bus className="h-5 w-5" />
              <span>APSRTC Routes</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'profile' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <User className="h-5 w-5" />
              <span>My Settings</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-850">
          <div className="flex items-center gap-3 mb-4 px-2">
            {profileForm.profilePic ? (
              <img src={profileForm.profilePic} className="h-10 w-10 rounded-full object-cover" alt="Student Profile" />
            ) : (
              <div className="bg-brand-500/15 p-2 rounded-lg text-brand-400">
                <User className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="text-xs text-slate-500">Reg No: {profile.regNumber}</div>
              <div className="text-sm font-medium text-white truncate max-w-[140px]">{profile.name}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-red-900/40 hover:text-red-300 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-bold text-slate-850">
            {activeTab === 'overview' ? `Welcome, ${profile.name}` : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Portal`}
          </h2>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg uppercase">
            {profile.branch} Branch • Semester {profile.semester}
          </div>
        </header>

        <div className="p-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Analytics Meters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Attendance Rate</div>
                  <div className="flex items-end gap-3 mt-2">
                    <span className="text-3xl font-extrabold text-slate-800">{attendancePercentage}%</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                      attendancePercentage >= 75 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {attendancePercentage >= 75 ? 'On Track' : 'Shortage Alert'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${attendancePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Overall Performance</div>
                  <div className="text-3xl font-extrabold mt-2 text-slate-800">{overallPercentage}%</div>
                  <p className="text-[10px] text-slate-400 mt-3 font-light">Subject-wise marks aggregate across active semester.</p>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Scholarships Active</div>
                  <div className="text-3xl font-extrabold mt-2 text-slate-800">{upcomingScholarships.length} Available</div>
                  <p className="text-[10px] text-slate-400 mt-3 font-light">Check details in the Scholarships section.</p>
                </div>
              </div>

              {/* Announcements & Scholarships Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Announcements */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-brand-600" />
                    <span>Recent Notices & Announcements</span>
                  </h3>
                  <div className="space-y-4">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-4 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{a.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            a.priority === 'HIGH' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-brand-700'
                          }`}>
                            {a.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-light leading-relaxed">{a.content}</p>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="text-xs text-slate-400 italic text-center py-6">No active notices.</div>
                    )}
                  </div>
                </div>

                {/* Upcoming deadlines */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                    Scholarship Deadlines
                  </h3>
                  <div className="space-y-4">
                    {upcomingScholarships.map((s) => (
                      <div key={s.id} className="p-3 border border-slate-100 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-slate-855 leading-tight">{s.name}</div>
                        <div className="text-[10px] text-red-600 font-medium">
                          Last Date: {new Date(s.lastDate).toLocaleDateString()}
                        </div>
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-600 flex items-center gap-1 font-semibold hover:underline"
                        >
                          <span>Apply Online</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Warnings */}
              {attendancePercentage < 75 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs flex items-center gap-3 font-semibold">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>Warning: Your attendance percentage ({attendancePercentage}%) is currently below the mandatory 75% limit. Please contact your HOD.</span>
                </div>
              )}

              {/* Subject Breakdown table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      <th className="px-6 py-4">Subject Code</th>
                      <th className="px-6 py-4">Subject Name</th>
                      <th className="px-6 py-4 text-center">Classes Attended / Total</th>
                      <th className="px-6 py-4 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {attendanceBreakdown.map((row) => (
                      <tr key={row.subjectCode} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-700">{row.subjectCode}</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{row.subjectName}</td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {row.present} / {row.total}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                          <span className={`px-2 py-1 rounded ${
                            row.percentage >= 75 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                          }`}>
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && (
            <div className="space-y-8">
              {/* Detailed Grades Sheet */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      <th className="px-6 py-4">Subject Code</th>
                      <th className="px-6 py-4">Subject Name</th>
                      <th className="px-6 py-4">Internals (Max 20)</th>
                      <th className="px-6 py-4">Assignments (Max 10)</th>
                      <th className="px-6 py-4">Labs (Max 50)</th>
                      <th className="px-6 py-4 text-right">Total Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {resultsList.map((r) => {
                      const totalScore = r.internalMarks + r.assignmentMarks + r.labMarks;
                      const maxPossible = 30 + (r.labMarks > 0 ? 50 : 0);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-700">{r.subject.code}</td>
                          <td className="px-6 py-4 text-slate-900 font-medium">{r.subject.name}</td>
                          <td className="px-6 py-4 text-slate-600">{r.internalMarks} / 20</td>
                          <td className="px-6 py-4 text-slate-600">{r.assignmentMarks} / 10</td>
                          <td className="px-6 py-4 text-slate-600">
                            {r.labMarks > 0 ? `${r.labMarks} / 50` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">
                            {totalScore} / {maxPossible} ({Math.round((totalScore / maxPossible) * 100)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Chart Analysis */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Subject Performance Index</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={resultsList.map(r => ({
                      code: r.subject.code,
                      score: Math.round(((r.internalMarks + r.assignmentMarks + r.labMarks) / (30 + (r.labMarks > 0 ? 50 : 0))) * 100)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="code" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" unit="%" />
                      <Tooltip />
                      <Bar dataKey="score" fill="#0e87e3" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TIMETABLE TAB */}
          {activeTab === 'timetable' && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                Weekly Class Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => {
                  const daySlots = timetable.filter(s => s.dayOfWeek === day);
                  return (
                    <div key={day} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-2 uppercase tracking-wide">
                        {day}
                      </div>
                      <div className="space-y-2">
                        {daySlots.length === 0 ? (
                          <div className="text-[10px] text-slate-400 font-light italic">No periods scheduled</div>
                        ) : (
                          daySlots.map((slot) => (
                            <div key={slot.id} className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm">
                              <div className="text-[10px] font-bold text-brand-600">Period {slot.periodNumber}</div>
                              <div className="text-xs font-semibold text-slate-800 mt-1 truncate">{slot.subject.name}</div>
                              <div className="text-[10px] text-slate-500 font-light mt-0.5 truncate">{slot.teacher.name}</div>
                              <div className="text-[10px] text-slate-400 font-light mt-0.5">
                                Classroom: {slot.classroom.roomName}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESOURCE CENTER TAB */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search resources or subjects"
                    className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium">Resources tailored for {profile.branch} Department</span>
              </div>

              {/* Resources list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredResources.map((res) => (
                  <div key={res.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                        {res.type}
                      </span>
                      <h4 className="font-bold text-sm text-slate-800 mt-2">{res.name}</h4>
                      <p className="text-xs text-slate-400 font-light mt-1">
                        Subject: {res.subject.name} ({res.subject.code})
                      </p>
                    </div>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-center text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Access Resource</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
                {filteredResources.length === 0 && (
                  <div className="text-xs text-slate-400 italic py-6 col-span-3 text-center">
                    No resources matched your search query.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TRANSPORT ROUTES TAB */}
          {activeTab === 'transport' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={routeSearch}
                    onChange={(e) => setRouteSearch(e.target.value)}
                    placeholder="Search by stops or destinations"
                    className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <select
                  value={busTypeFilter}
                  onChange={(e) => setBusTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="Pallevelugu">Pallevelugu</option>
                  <option value="Express">Express</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>

              {/* Routes list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRoutes.map((r) => (
                  <div key={r.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">Route {r.routeNumber}</span>
                      <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {r.busType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-semibold">
                      {r.source} ➔ {r.destination}
                    </div>
                    <div className="text-xs text-slate-500 font-light">
                      Stops: {r.stops}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] font-semibold text-slate-600">
                      <div>Departs: <span className="text-brand-600">{r.departureTime}</span></div>
                      <div>Arrives: <span className="text-brand-600">{r.arrivalTime}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Contacts Form */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Update Contact details
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Profile Picture URL
                    </label>
                    <input
                      type="text"
                      value={profileForm.profilePic}
                      onChange={(e) => setProfileForm({ ...profileForm, profilePic: e.target.value })}
                      placeholder="Enter base64 or online link"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Update Password
                </h3>
                {pwdMsg.text && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    pwdMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {pwdMsg.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    {pwdLoading ? 'Saving...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
