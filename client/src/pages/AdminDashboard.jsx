import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  LayoutDashboard, Users, GraduationCap, Calendar, Bus, Volume2, Award, BookOpen,
  Plus, Search, Trash2, Edit, Power, RotateCcw, FileSpreadsheet, CheckCircle2,
  AlertCircle, LogOut, Check, X, ShieldAlert, Layers
} from 'lucide-react';

const COLORS = ['#0e87e3', '#38a3f6', '#026abf', '#074880', '#0c3d6b'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'Admin' };

  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [resources, setResources] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // student, teacher, dept, subject, route, scholarship, notice, resource, slot
  const [modalData, setModalData] = useState({});
  const [modalEditId, setModalEditId] = useState(null);
  
  // Dynamic lists
  const [studentsList, setStudentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [timetableConflicts, setTimetableConflicts] = useState([]);
  
  // Search & Filter filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranch, setStudentBranch] = useState('');
  const [studentSem, setStudentSem] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherBranch, setTeacherBranch] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  // Load metrics and lists
  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/admin/students?search=${studentSearch}&branch=${studentBranch}&semester=${studentSem}`);
      setStudentsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get(`/admin/teachers?search=${teacherSearch}&branch=${teacherBranch}`);
      setTeachersList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAcademics = async () => {
    try {
      const [deptRes, subRes, classRes] = await Promise.all([
        api.get('/shared/departments'),
        api.get('/shared/subjects'),
        api.get('/admin/classrooms'),
      ]);
      setDepartments(deptRes.data);
      setSubjects(subRes.data);
      setClassrooms(classRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUtilities = async () => {
    try {
      const [noticeRes, scholRes, routeRes, resRes] = await Promise.all([
        api.get('/shared/announcements'),
        api.get('/shared/scholarships'),
        api.get('/shared/routes'),
        api.get('/admin/resources'),
      ]);
      setAnnouncements(noticeRes.data);
      setScholarships(scholRes.data);
      setRoutes(routeRes.data);
      setResources(resRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await api.get('/shared/timetable');
      setTimetableSlots(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchStudents();
    fetchTeachers();
    fetchAcademics();
    fetchUtilities();
    fetchTimetable();
  }, [studentSearch, studentBranch, studentSem, teacherSearch, teacherBranch]);

  // Actions
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Generic Save / Update handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      if (modalType === 'student') endpoint = '/admin/students';
      else if (modalType === 'teacher') endpoint = '/admin/teachers';
      else if (modalType === 'dept') endpoint = '/admin/departments';
      else if (modalType === 'subject') endpoint = '/admin/subjects';
      else if (modalType === 'route') endpoint = '/admin/routes';
      else if (modalType === 'scholarship') endpoint = '/admin/scholarships';
      else if (modalType === 'notice') endpoint = '/admin/announcements';
      else if (modalType === 'resource') endpoint = '/admin/resources';
      else if (modalType === 'slot') endpoint = '/admin/timetable';

      if (modalEditId) {
        await api.put(`${endpoint}/${modalEditId}`, modalData);
      } else {
        await api.post(endpoint, modalData);
      }

      setShowModal(false);
      setModalData({});
      setModalEditId(null);
      
      // refresh lists
      fetchMetrics();
      fetchStudents();
      fetchTeachers();
      fetchAcademics();
      fetchUtilities();
      fetchTimetable();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Conflict or server error occurred. Please check details.');
    }
  };

  // Toggle user active status
  const handleUserToggle = async (userId, active) => {
    try {
      await api.post('/admin/users/toggle-status', { userId, active });
      fetchStudents();
      fetchTeachers();
    } catch (err) {
      console.error(err);
    }
  };

  // Reset password
  const handleResetPassword = async (id, role) => {
    try {
      const endpoint = role === 'STUDENT' ? `/admin/students/${id}/reset-password` : `/admin/teachers/${id}/reset-password`;
      await api.post(endpoint);
      alert('Password reset successfully to default.');
    } catch (err) {
      console.error(err);
    }
  };

  // Delete entity
  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      let endpoint = '';
      if (type === 'student') endpoint = `/admin/students/${id}`;
      else if (type === 'teacher') endpoint = `/admin/teachers/${id}`;
      else if (type === 'dept') endpoint = `/admin/departments/${id}`;
      else if (type === 'subject') endpoint = `/admin/subjects/${id}`;
      else if (type === 'route') endpoint = `/admin/routes/${id}`;
      else if (type === 'scholarship') endpoint = `/admin/scholarships/${id}`;
      else if (type === 'notice') endpoint = `/admin/announcements/${id}`;
      else if (type === 'resource') endpoint = `/admin/resources/${id}`;
      else if (type === 'slot') endpoint = `/admin/timetable/${id}`;

      await api.delete(endpoint);
      fetchMetrics();
      fetchStudents();
      fetchTeachers();
      fetchAcademics();
      fetchUtilities();
      fetchTimetable();
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Import student handler
  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await api.post('/admin/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(res.data.message);
      setCsvFile(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert('Error importing file.');
    }
  };

  // Auto Generate Timetable
  const handleAutoGenerateTimetable = async () => {
    if (!window.confirm('This will wipe out all currently assigned periods and replace them with auto-generated conflict-free periods. Continue?')) return;
    try {
      const res = await api.post('/admin/timetable/generate');
      alert(res.data.message);
      fetchTimetable();
    } catch (err) {
      console.error(err);
      alert('Generation failed.');
    }
  };

  // Validate Schedule
  const handleValidateSchedule = async () => {
    try {
      const res = await api.get('/admin/timetable/validate');
      if (res.data.isValid) {
        alert('All timetables are valid and conflict-free!');
      } else {
        setTimetableConflicts(res.data.conflicts);
        alert(`Detected ${res.data.conflicts.length} conflict(s). Review highlights.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="h-16 flex items-center gap-3 px-6 bg-slate-950">
            <GraduationCap className="h-7 w-7 text-brand-400" />
            <span className="text-lg font-bold text-white tracking-tight">CampusConnect</span>
          </div>
          <div className="px-4 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Admin Portal
          </div>
          <nav className="px-2 space-y-1">
            <button
              onClick={() => { setActiveTab('overview'); setTimetableConflicts([]); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'overview' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => { setActiveTab('students'); setTimetableConflicts([]); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'students' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Students</span>
            </button>
            <button
              onClick={() => { setActiveTab('teachers'); setTimetableConflicts([]); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'teachers' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="h-5 w-5" />
              <span>Teachers</span>
            </button>
            <button
              onClick={() => { setActiveTab('academics'); setTimetableConflicts([]); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'academics' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Layers className="h-5 w-5" />
              <span>Academics</span>
            </button>
            <button
              onClick={() => { setActiveTab('timetable'); setTimetableConflicts([]); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'timetable' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Timetable</span>
            </button>
            <button
              onClick={() => { setActiveTab('utilities'); setTimetableConflicts([]); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'utilities' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Bus className="h-5 w-5" />
              <span>Utilities & Info</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-850">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="bg-brand-500/15 p-2 rounded-lg text-brand-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Logged in as</div>
              <div className="text-sm font-medium text-white truncate max-w-[140px]">{user.name}</div>
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
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Portal
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>College ERP Version 1.0.0</span>
          </div>
        </header>

        <div className="p-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && metrics && (
            <div className="space-y-8">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Students</div>
                  <div className="text-3xl font-extrabold mt-2 text-slate-800">{metrics.totalStudents}</div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Faculty</div>
                  <div className="text-3xl font-extrabold mt-2 text-slate-800">{metrics.totalTeachers}</div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Departments</div>
                  <div className="text-3xl font-extrabold mt-2 text-slate-800">{metrics.totalDepartments}</div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Subjects Taught</div>
                  <div className="text-3xl font-extrabold mt-2 text-slate-800">{metrics.totalSubjects}</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Department Distribution */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-755 uppercase tracking-wider mb-6">Students per Branch</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={metrics.departmentStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="branch" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="count" fill="#026abf" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Attendance Chart */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-755 uppercase tracking-wider mb-6">Overall Attendance Split</h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.attendanceStats.map(a => ({ name: a.status, value: a._count.status }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.attendanceStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.status === 'PRESENT' ? '#10b981' : '#ef4444'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search Registration No / Name"
                      className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 w-60"
                    />
                  </div>
                  <select
                    value={studentBranch}
                    onChange={(e) => setStudentBranch(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">All Branches</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="Civil">Civil</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                  <select
                    value={studentSem}
                    onChange={(e) => setStudentSem(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">All Semesters</option>
                    <option value="1">1st Sem</option>
                    <option value="2">2nd Sem</option>
                    <option value="3">3rd Sem</option>
                    <option value="4">4th Sem</option>
                    <option value="5">5th Sem</option>
                    <option value="6">6th Sem</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setModalType('student');
                      setModalData({ branch: 'CSE', semester: 1 });
                      setModalEditId(null);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Student</span>
                  </button>

                  <form onSubmit={handleCsvImport} className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-50 transition">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      <span>{csvFile ? csvFile.name : 'Select CSV'}</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    {csvFile && (
                      <button type="submit" className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
                        Import
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      <th className="px-6 py-4">Reg Number</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Semester</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {studentsList.map((stud) => (
                      <tr key={stud.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-700">{stud.regNumber}</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{stud.name}</td>
                        <td className="px-6 py-4 text-slate-500">{stud.branch}</td>
                        <td className="px-6 py-4 text-slate-500">{stud.semester} Sem</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleUserToggle(stud.userId, !stud.user.isActive)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              stud.user.isActive
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {stud.user.isActive ? 'Active' : 'Deactivated'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleResetPassword(stud.id, 'STUDENT')}
                            title="Reset Password"
                            className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-brand-50"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setModalType('student');
                              setModalData(stud);
                              setModalEditId(stud.id);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-yellow-600 rounded-lg hover:bg-yellow-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(stud.id, 'student')}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TEACHERS TAB */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Search Faculty ID / Name"
                      className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 w-60"
                    />
                  </div>
                  <select
                    value={teacherBranch}
                    onChange={(e) => setTeacherBranch(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="Civil">Civil</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setModalType('teacher');
                    setModalData({ branch: 'CSE' });
                    setModalEditId(null);
                    setShowModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Teacher</span>
                </button>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      <th className="px-6 py-4">Faculty ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Assigned Subjects</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {teachersList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-700">{t.facultyId}</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{t.name}</td>
                        <td className="px-6 py-4 text-slate-500">{t.branch}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {t.teacherSubjects.map(ts => ts.subject.code).join(', ') || 'None'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleUserToggle(t.userId, !t.user.isActive)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              t.user?.isActive
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {t.user?.isActive ? 'Active' : 'Deactivated'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => {
                              setModalType('assign-subjects');
                              // Load currently checked subjects
                              setModalData({
                                teacherId: t.id,
                                name: t.name,
                                branch: t.branch,
                                subjectIds: t.teacherSubjects.map(ts => ts.subjectId)
                              });
                              setShowModal(true);
                            }}
                            title="Assign Subjects"
                            className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-medium border border-brand-200"
                          >
                            Subjects
                          </button>
                          <button
                            onClick={() => handleResetPassword(t.id, 'TEACHER')}
                            title="Reset Password"
                            className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-brand-50"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setModalType('teacher');
                              setModalData(t);
                              setModalEditId(t.id);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-yellow-600 rounded-lg hover:bg-yellow-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, 'teacher')}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACADEMICS TAB */}
          {activeTab === 'academics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Departments column */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Departments</h3>
                  <button
                    onClick={() => {
                      setModalType('dept');
                      setModalData({});
                      setModalEditId(null);
                      setShowModal(true);
                    }}
                    className="p-1 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {departments.map((d) => (
                    <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{d.code}</div>
                        <div className="text-slate-500 font-light">{d.name}</div>
                      </div>
                      <button onClick={() => handleDelete(d.id, 'dept')} className="p-1 text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subjects Column */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Subjects Registry</h3>
                  <button
                    onClick={() => {
                      setModalType('subject');
                      setModalData({ branch: 'CSE', semester: 1 });
                      setModalEditId(null);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 font-semibold text-slate-500">
                        <th className="py-2">Code</th>
                        <th className="py-2">Name</th>
                        <th className="py-2">Branch</th>
                        <th className="py-2">Semester</th>
                        <th className="py-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {subjects.map((sub) => (
                        <tr key={sub.id} className="text-slate-600">
                          <td className="py-2.5 font-semibold text-slate-700">{sub.code}</td>
                          <td className="py-2.5 font-medium text-slate-900">{sub.name}</td>
                          <td className="py-2.5">{sub.branch}</td>
                          <td className="py-2.5">{sub.semester} Sem</td>
                          <td className="py-2.5 text-right">
                            <button onClick={() => handleDelete(sub.id, 'subject')} className="text-slate-400 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TIMETABLE TAB */}
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              {/* Warnings and Conflicts alert pane */}
              {timetableConflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                    <span>Timetable Validation Failures ({timetableConflicts.length})</span>
                  </div>
                  <ul className="list-disc pl-5 text-xs space-y-1.5 font-medium">
                    {timetableConflicts.map((c, idx) => (
                      <li key={idx}>{c.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Toolbar */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAutoGenerateTimetable}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    Auto Generate Smart Timetable
                  </button>
                  <button
                    onClick={handleValidateSchedule}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
                  >
                    <ShieldAlert className="h-4 w-4 text-brand-600" />
                    <span>Run Conflict Check</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setModalType('slot');
                    setModalData({ dayOfWeek: 'MONDAY', periodNumber: 1, branch: 'CSE', semester: 1 });
                    setModalEditId(null);
                    setShowModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Assign Schedule Period</span>
                </button>
              </div>

              {/* Timetable Grid View */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Current Schedule Grid
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => {
                    const daySlots = timetableSlots.filter(s => s.dayOfWeek === day);
                    return (
                      <div key={day} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                        <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-2 uppercase tracking-wide">
                          {day}
                        </div>
                        <div className="space-y-2">
                          {daySlots.length === 0 ? (
                            <div className="text-[10px] text-slate-400 font-light italic">No slots scheduled</div>
                          ) : (
                            daySlots.map((slot) => (
                              <div key={slot.id} className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm relative group">
                                <button
                                  onClick={() => handleDelete(slot.id, 'slot')}
                                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                                <div className="text-[10px] font-bold text-brand-600">Period {slot.periodNumber}</div>
                                <div className="text-xs font-semibold text-slate-800 mt-1 truncate">{slot.subject.name}</div>
                                <div className="text-[10px] text-slate-500 font-light mt-0.5 truncate">{slot.teacher.name}</div>
                                <div className="text-[10px] text-slate-400 font-light truncate mt-0.5">
                                  {slot.classroom.roomName} • {slot.branch} S{slot.semester}
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
            </div>
          )}

          {/* UTILITIES & INFO TAB */}
          {activeTab === 'utilities' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Announcements */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Announcements</h3>
                  <button
                    onClick={() => {
                      setModalType('notice');
                      setModalData({ category: 'General Notices', priority: 'MEDIUM' });
                      setModalEditId(null);
                      setShowModal(true);
                    }}
                    className="p-1 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-3 border border-slate-150 rounded-xl flex justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{a.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            a.priority === 'HIGH' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-brand-700'
                          }`}>
                            {a.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{a.content}</p>
                      </div>
                      <button onClick={() => handleDelete(a.id, 'notice')} className="text-slate-400 hover:text-red-500 self-start">
                        <Trash2 className="h-4 w-4 shrink-0" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transport Routes */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">APSRTC Bus Routes</h3>
                  <button
                    onClick={() => {
                      setModalType('route');
                      setModalData({ busType: 'Pallevelugu' });
                      setModalEditId(null);
                      setShowModal(true);
                    }}
                    className="p-1 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {routes.map((r) => (
                    <div key={r.id} className="p-3 border border-slate-150 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-800">
                          Route {r.routeNumber} ({r.busType})
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          {r.source} ➔ {r.destination}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Stops: {r.stops}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold text-brand-600">{r.departureTime}</span>
                        <button onClick={() => handleDelete(r.id, 'route')} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* POPUP MODAL FOR FORMS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {modalEditId ? 'Edit' : 'Create'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* STUDENT FORM */}
              {modalType === 'student' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      disabled={!!modalEditId}
                      value={modalData.regNumber || ''}
                      onChange={(e) => setModalData({ ...modalData, regNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Branch
                      </label>
                      <select
                        value={modalData.branch || 'CSE'}
                        onChange={(e) => setModalData({ ...modalData, branch: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2"
                      >
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="Civil">Civil</option>
                        <option value="Mechanical">Mechanical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Semester
                      </label>
                      <select
                        value={modalData.semester || 1}
                        onChange={(e) => setModalData({ ...modalData, semester: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2"
                      >
                        {[1, 2, 3, 4, 5, 6].map(s => (
                          <option key={s} value={s}>{s} Sem</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={modalData.email || ''}
                      onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={modalData.mobile || ''}
                      onChange={(e) => setModalData({ ...modalData, mobile: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </>
              )}

              {/* TEACHER FORM */}
              {modalType === 'teacher' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Faculty ID / Username
                    </label>
                    <input
                      type="text"
                      disabled={!!modalEditId}
                      value={modalData.facultyId || ''}
                      onChange={(e) => setModalData({ ...modalData, facultyId: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <select
                      value={modalData.branch || 'CSE'}
                      onChange={(e) => setModalData({ ...modalData, branch: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="Civil">Civil</option>
                      <option value="Mechanical">Mechanical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={modalData.email || ''}
                      onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={modalData.mobile || ''}
                      onChange={(e) => setModalData({ ...modalData, mobile: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </>
              )}

              {/* SUBJECT ASSIGNMENT CHECKBOXES FORM */}
              {modalType === 'assign-subjects' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500">
                    Select subjects to assign to <span className="font-bold text-slate-700">{modalData.name}</span>:
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-100 p-3 rounded-lg">
                    {subjects.filter(s => s.branch === modalData.branch).map(sub => {
                      const isChecked = modalData.subjectIds.includes(sub.id);
                      return (
                        <label key={sub.id} className="flex items-center gap-3 text-xs p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const newChecked = isChecked
                                ? modalData.subjectIds.filter(id => id !== sub.id)
                                : [...modalData.subjectIds, sub.id];
                              setModalData({ ...modalData, subjectIds: newChecked });
                            }}
                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                          />
                          <div>
                            <span className="font-semibold text-slate-700">{sub.code}</span> — {sub.name} (Sem {sub.semester})
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.post('/admin/teachers/assign-subjects', {
                          teacherId: modalData.teacherId,
                          subjectIds: modalData.subjectIds
                        });
                        setShowModal(false);
                        fetchTeachers();
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Save Assignment
                  </button>
                </div>
              )}

              {/* DEPT FORM */}
              {modalType === 'dept' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Department Code (e.g. CSE, ECE)
                    </label>
                    <input
                      type="text"
                      value={modalData.code || ''}
                      onChange={(e) => setModalData({ ...modalData, code: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                </>
              )}

              {/* SUBJECT FORM */}
              {modalType === 'subject' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Subject Code (e.g. CS101)
                    </label>
                    <input
                      type="text"
                      value={modalData.code || ''}
                      onChange={(e) => setModalData({ ...modalData, code: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Branch
                      </label>
                      <select
                        value={modalData.branch || 'CSE'}
                        onChange={(e) => setModalData({ ...modalData, branch: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="Civil">Civil</option>
                        <option value="Mechanical">Mechanical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Semester
                      </label>
                      <select
                        value={modalData.semester || 1}
                        onChange={(e) => setModalData({ ...modalData, semester: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        {[1, 2, 3, 4, 5, 6].map(s => (
                          <option key={s} value={s}>{s} Sem</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* TIMETABLE SLOT SCHEDULER FORM */}
              {modalType === 'slot' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Day of Week
                      </label>
                      <select
                        value={modalData.dayOfWeek || 'MONDAY'}
                        onChange={(e) => setModalData({ ...modalData, dayOfWeek: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Period Number
                      </label>
                      <select
                        value={modalData.periodNumber || 1}
                        onChange={(e) => setModalData({ ...modalData, periodNumber: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        {[1, 2, 3, 5, 6].map(p => (
                          <option key={p} value={p}>Period {p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Class Branch
                      </label>
                      <select
                        value={modalData.branch || 'CSE'}
                        onChange={(e) => setModalData({ ...modalData, branch: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="Civil">Civil</option>
                        <option value="Mechanical">Mechanical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Class Semester
                      </label>
                      <select
                        value={modalData.semester || 1}
                        onChange={(e) => setModalData({ ...modalData, semester: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        {[1, 2, 3, 4, 5, 6].map(s => (
                          <option key={s} value={s}>{s} Sem</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <select
                      value={modalData.subjectId || ''}
                      onChange={(e) => setModalData({ ...modalData, subjectId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.filter(s => s.branch === modalData.branch && s.semester === modalData.semester).map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.code} — {sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Assigned Teacher
                    </label>
                    <select
                      value={modalData.teacherId || ''}
                      onChange={(e) => setModalData({ ...modalData, teacherId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    >
                      <option value="">Select Teacher</option>
                      {teachersList.filter(t => t.branch === modalData.branch).map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Classroom Location
                    </label>
                    <select
                      value={modalData.classroomId || ''}
                      onChange={(e) => setModalData({ ...modalData, classroomId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    >
                      <option value="">Select Classroom</option>
                      {classrooms.map(room => (
                        <option key={room.id} value={room.id}>{room.roomName} (Cap: {room.capacity})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* ANNOUNCEMENT FORM */}
              {modalType === 'notice' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={modalData.title || ''}
                      onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Content Description
                    </label>
                    <textarea
                      value={modalData.content || ''}
                      onChange={(e) => setModalData({ ...modalData, content: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs h-24"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={modalData.category || 'General Notices'}
                        onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        {['Examination', 'Results', 'Workshops', 'Seminars', 'Technical Events', 'Holidays', 'General Notices'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Priority Level
                      </label>
                      <select
                        value={modalData.priority || 'MEDIUM'}
                        onChange={(e) => setModalData({ ...modalData, priority: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* TRANSPORT FORM */}
              {modalType === 'route' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Route Number
                      </label>
                      <input
                        type="text"
                        value={modalData.routeNumber || ''}
                        onChange={(e) => setModalData({ ...modalData, routeNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Bus Type
                      </label>
                      <select
                        value={modalData.busType || 'Pallevelugu'}
                        onChange={(e) => setModalData({ ...modalData, busType: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Pallevelugu">Pallevelugu</option>
                        <option value="Express">Express</option>
                        <option value="Deluxe">Deluxe</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Source Station
                      </label>
                      <input
                        type="text"
                        value={modalData.source || ''}
                        onChange={(e) => setModalData({ ...modalData, source: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={modalData.destination || ''}
                        onChange={(e) => setModalData({ ...modalData, destination: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Departure Time
                      </label>
                      <input
                        type="text"
                        value={modalData.departureTime || ''}
                        onChange={(e) => setModalData({ ...modalData, departureTime: e.target.value })}
                        placeholder="e.g. 08:00 AM"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Arrival Time
                      </label>
                      <input
                        type="text"
                        value={modalData.arrivalTime || ''}
                        onChange={(e) => setModalData({ ...modalData, arrivalTime: e.target.value })}
                        placeholder="e.g. 08:45 AM"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Stops Covered (comma separated)
                    </label>
                    <input
                      type="text"
                      value={modalData.stops || ''}
                      onChange={(e) => setModalData({ ...modalData, stops: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                </>
              )}

              {modalType !== 'assign-subjects' && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
