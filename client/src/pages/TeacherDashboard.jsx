import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Calendar, CheckSquare, Edit, Award, LogOut, Check, X, ShieldAlert,
  User, RefreshCw, AlertCircle, Save, Plus
} from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};

  const [activeTab, setActiveTab] = useState('attendance');
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentsList, setStudentsList] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' }
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Marks state
  const [marksList, setMarksList] = useState([]);
  const [editingMarks, setEditingMarks] = useState({}); // { studentId: { internalMarks, assignmentMarks, labMarks } }
  
  // Timetable & Profile states
  const [timetable, setTimetable] = useState([]);
  const [profile, setProfile] = useState({ email: '', mobile: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  // Load basic data
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const [subRes, ttRes, profRes] = await Promise.all([
          api.get('/teacher/subjects'),
          api.get('/teacher/timetable'),
          api.get('/auth/verify'), // gets fresh details
        ]);
        setAssignedSubjects(subRes.data);
        if (subRes.data.length > 0) {
          setSelectedSubject(subRes.data[0].id.toString());
        }
        setTimetable(ttRes.data);
        if (profRes.data.details) {
          setProfile({
            email: profRes.data.details.email || '',
            mobile: profRes.data.details.mobile || '',
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeacherData();
  }, []);

  // Fetch student roster for Attendance or Marks
  const handleLoadClass = async () => {
    if (!selectedSubject) return;
    try {
      setStudentsList([]);
      setAttendanceRecords({});
      
      // Load student list
      const listRes = await api.get(`/teacher/students?subjectId=${selectedSubject}`);
      
      // Load existing attendance for this date if it exists
      const existingRes = await api.get(`/teacher/attendance?subjectId=${selectedSubject}&date=${attendanceDate}`);
      
      setStudentsList(listRes.data);
      
      // Build attendance map
      const initialMap = {};
      listRes.data.forEach((stud) => {
        initialMap[stud.id] = 'PRESENT'; // default
      });
      
      existingRes.data.forEach((record) => {
        initialMap[record.studentId] = record.status;
      });
      
      setAttendanceRecords(initialMap);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadMarks = async () => {
    if (!selectedSubject) return;
    try {
      const res = await api.get(`/teacher/marks?subjectId=${selectedSubject}`);
      setMarksList(res.data);
      const editMap = {};
      res.data.forEach((item) => {
        editMap[item.studentId] = {
          internalMarks: item.marks.internalMarks,
          assignmentMarks: item.marks.assignmentMarks,
          labMarks: item.marks.labMarks,
        };
      });
      setEditingMarks(editMap);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      handleLoadClass();
    } else if (activeTab === 'marks') {
      handleLoadMarks();
    }
  }, [selectedSubject, activeTab, attendanceDate]);

  // Submit Attendance
  const submitAttendance = async () => {
    setSubmittingAttendance(true);
    try {
      const recordsArray = Object.keys(attendanceRecords).map((studentId) => ({
        studentId: parseInt(studentId),
        status: attendanceRecords[studentId],
      }));

      await api.post('/teacher/attendance', {
        subjectId: parseInt(selectedSubject),
        date: attendanceDate,
        records: recordsArray,
      });
      alert('Attendance saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Error saving attendance.');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Submit single student marks
  const submitSingleMarks = async (studentId) => {
    const marksData = editingMarks[studentId];
    try {
      await api.post('/teacher/marks', {
        studentId: parseInt(studentId),
        subjectId: parseInt(selectedSubject),
        internalMarks: parseFloat(marksData.internalMarks || 0),
        assignmentMarks: parseFloat(marksData.assignmentMarks || 0),
        labMarks: parseFloat(marksData.labMarks || 0),
      });
      alert('Marks updated successfully.');
      handleLoadMarks();
    } catch (err) {
      console.error(err);
      alert('Error updating marks.');
    }
  };

  // Update profile contacts
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/teacher/profile', profile);
      alert('Profile details updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Error updating profile contacts.');
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: prompt('Enter current password to confirm change:') || '',
        newPassword,
      });
      setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Password update failed.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="h-16 flex items-center gap-3 px-6 bg-slate-950">
            <CheckSquare className="h-7 w-7 text-brand-400" />
            <span className="text-lg font-bold text-white tracking-tight">CampusConnect</span>
          </div>
          <div className="px-4 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Teacher Portal
          </div>
          <nav className="px-2 space-y-1">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'attendance' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="h-5 w-5" />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab('marks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'marks' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <Award className="h-5 w-5" />
              <span>Upload Marks</span>
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
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'profile' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/15' : 'hover:bg-slate-800'
              }`}
            >
              <User className="h-5 w-5" />
              <span>My Profile</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-850">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="bg-brand-500/15 p-2 rounded-lg text-brand-400">
              <User className="h-5 w-5" />
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
            {activeTab === 'attendance' ? 'Roll Call Sheet' : activeTab === 'marks' ? 'Marks Entry Grid' : 'Teacher View'}
          </h2>
          <div className="flex items-center gap-4">
            {/* Subject Selector */}
            {activeTab !== 'profile' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold uppercase">Subject:</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {assignedSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} — {sub.name} (Sem {sub.semester})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        <div className="p-8">
          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Date selector toolbar */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 uppercase">Class Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <button
                  onClick={submitAttendance}
                  disabled={submittingAttendance || studentsList.length === 0}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition"
                >
                  {submittingAttendance ? 'Saving...' : 'Submit Roll Call'}
                </button>
              </div>

              {/* Roster Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      <th className="px-6 py-4">Reg Number</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {studentsList.map((stud) => (
                      <tr key={stud.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-700">{stud.regNumber}</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{stud.name}</td>
                        <td className="px-6 py-4 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setAttendanceRecords({ ...attendanceRecords, [stud.id]: 'PRESENT' })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                              attendanceRecords[stud.id] === 'PRESENT'
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-slate-100 text-slate-400 border border-transparent'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceRecords({ ...attendanceRecords, [stud.id]: 'ABSENT' })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                              attendanceRecords[stud.id] === 'ABSENT'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-slate-100 text-slate-400 border border-transparent'
                            }`}
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    ))}
                    {studentsList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">
                          No students found in this class. Make sure the subject code branch matches registered students.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MARKS TAB */}
          {activeTab === 'marks' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      <th className="px-6 py-4">Reg Number</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Internals (Max 20)</th>
                      <th className="px-6 py-4">Assignments (Max 10)</th>
                      <th className="px-6 py-4">Labs (Max 50)</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {marksList.map((item) => {
                      const editItem = editingMarks[item.studentId] || {};
                      return (
                        <tr key={item.studentId} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-700">{item.regNumber}</td>
                          <td className="px-6 py-4 text-slate-900 font-medium">{item.name}</td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              max="20"
                              min="0"
                              value={editItem.internalMarks || 0}
                              onChange={(e) => {
                                setEditingMarks({
                                  ...editingMarks,
                                  [item.studentId]: { ...editItem, internalMarks: e.target.value }
                                });
                              }}
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-center"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              max="10"
                              min="0"
                              value={editItem.assignmentMarks || 0}
                              onChange={(e) => {
                                setEditingMarks({
                                  ...editingMarks,
                                  [item.studentId]: { ...editItem, assignmentMarks: e.target.value }
                                });
                              }}
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-center"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              max="50"
                              min="0"
                              value={editItem.labMarks || 0}
                              onChange={(e) => {
                                setEditingMarks({
                                  ...editingMarks,
                                  [item.studentId]: { ...editItem, labMarks: e.target.value }
                                });
                              }}
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-center"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => submitSingleMarks(item.studentId)}
                              className="p-1.5 text-slate-500 hover:text-green-600 rounded-lg hover:bg-green-50"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TIMETABLE TAB */}
          {activeTab === 'timetable' && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                Assigned Period Slots
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
                              <div className="text-[10px] text-slate-400 font-light truncate mt-0.5">
                                {slot.classroom.roomName} • {slot.branch} Sem {slot.semester}
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

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile details */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Update Contact Information
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Faculty Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
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
                      value={profile.mobile}
                      onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      required
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

              {/* Password change */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Change Access Password
                </h3>
                {pwdMsg.text && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    pwdMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {pwdMsg.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
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
