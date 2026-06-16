import express from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';

// Import middlewares
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

// Import controllers
import * as authController from '../controllers/auth.controller.js';
import * as adminController from '../controllers/admin.controller.js';
import * as teacherController from '../controllers/teacher.controller.js';
import * as studentController from '../controllers/student.controller.js';
import * as timetableController from '../controllers/timetable.controller.js';

const router = express.Router();

// Multer setup for temporary uploads (e.g. bulk CSV student importing)
const upload = multer({ dest: path.join(os.tmpdir(), 'campusconnect-uploads') });

// ==================== PUBLIC ROUTES ====================
router.post('/auth/login', authController.login);

// ==================== PROTECTED ROUTES ====================
router.use(authenticateJWT);

// Shared profile verification/update paths
router.get('/auth/verify', authController.verifyToken);
router.post('/auth/change-password', authController.changePassword);

// Shared queries for list views
router.get('/shared/announcements', adminController.getAnnouncements);
router.get('/shared/scholarships', adminController.getScholarships);
router.get('/shared/routes', adminController.getRoutes);
router.get('/shared/departments', adminController.getDepartments);
router.get('/shared/subjects', adminController.getSubjects);
router.get('/shared/timetable', timetableController.getFullTimetable);

// ==================== ADMIN ONLY ROUTES ====================
const adminGuard = requireRole(['ADMIN']);

// Students CRUD
router.get('/admin/students', adminGuard, adminController.getStudents);
router.post('/admin/students', adminGuard, adminController.createStudent);
router.put('/admin/students/:id', adminGuard, adminController.updateStudent);
router.delete('/admin/students/:id', adminGuard, adminController.deleteStudent);
router.post('/admin/students/:id/reset-password', adminGuard, adminController.resetStudentPassword);
router.post('/admin/students/import', adminGuard, upload.single('file'), adminController.bulkImportStudents);

// Teachers CRUD
router.get('/admin/teachers', adminGuard, adminController.getTeachers);
router.post('/admin/teachers', adminGuard, adminController.createTeacher);
router.put('/admin/teachers/:id', adminGuard, adminController.updateTeacher);
router.delete('/admin/teachers/:id', adminGuard, adminController.deleteTeacher);
router.post('/admin/teachers/:id/reset-password', adminGuard, adminController.resetTeacherPassword);
router.post('/admin/teachers/assign-subjects', adminGuard, adminController.assignTeacherSubjects);

// Accounts Control
router.post('/admin/users/toggle-status', adminGuard, adminController.toggleUserStatus);

// Departments CRUD
router.get('/admin/departments', adminGuard, adminController.getDepartments);
router.post('/admin/departments', adminGuard, adminController.createDepartment);
router.put('/admin/departments/:id', adminGuard, adminController.updateDepartment);
router.delete('/admin/departments/:id', adminGuard, adminController.deleteDepartment);

// Subjects CRUD
router.get('/admin/subjects', adminGuard, adminController.getSubjects);
router.post('/admin/subjects', adminGuard, adminController.createSubject);
router.put('/admin/subjects/:id', adminGuard, adminController.updateSubject);
router.delete('/admin/subjects/:id', adminGuard, adminController.deleteSubject);

// Classrooms CRUD
router.get('/admin/classrooms', adminGuard, adminController.getClassrooms);
router.post('/admin/classrooms', adminGuard, adminController.createClassroom);
router.delete('/admin/classrooms/:id', adminGuard, adminController.deleteClassroom);

// Scholarships CRUD
router.get('/admin/scholarships', adminGuard, adminController.getScholarships);
router.post('/admin/scholarships', adminGuard, adminController.createScholarship);
router.put('/admin/scholarships/:id', adminGuard, adminController.updateScholarship);
router.delete('/admin/scholarships/:id', adminGuard, adminController.deleteScholarship);

// Announcements CRUD
router.get('/admin/announcements', adminGuard, adminController.getAnnouncements);
router.post('/admin/announcements', adminGuard, adminController.createAnnouncement);
router.delete('/admin/announcements/:id', adminGuard, adminController.deleteAnnouncement);

// Transport Routes CRUD
router.get('/admin/routes', adminGuard, adminController.getRoutes);
router.post('/admin/routes', adminGuard, adminController.createRoute);
router.put('/admin/routes/:id', adminGuard, adminController.updateRoute);
router.delete('/admin/routes/:id', adminGuard, adminController.deleteRoute);

// Educational Resources CRUD
router.get('/admin/resources', adminGuard, adminController.getResources);
router.post('/admin/resources', adminGuard, adminController.createResource);
router.delete('/admin/resources/:id', adminGuard, adminController.deleteResource);

// Smart Timetable Scheduler
router.post('/admin/timetable', adminGuard, timetableController.createTimetableSlot);
router.put('/admin/timetable/:id', adminGuard, timetableController.updateTimetableSlot);
router.delete('/admin/timetable/:id', adminGuard, timetableController.deleteTimetableSlot);
router.post('/admin/timetable/generate', adminGuard, timetableController.autoGenerateTimetable);
router.get('/admin/timetable/validate', adminGuard, timetableController.validateAllSchedules);

// Global Stats
router.get('/admin/metrics', adminGuard, adminController.getAdminMetrics);

// ==================== TEACHER ONLY ROUTES ====================
const teacherGuard = requireRole(['TEACHER']);

router.get('/teacher/subjects', teacherGuard, teacherController.getAssignedSubjects);
router.get('/teacher/students', teacherGuard, teacherController.getStudentsBySubject);
router.get('/teacher/attendance', teacherGuard, teacherController.getAttendanceList);
router.post('/teacher/attendance', teacherGuard, teacherController.submitOrUpdateAttendance);
router.get('/teacher/marks', teacherGuard, teacherController.getMarksListBySubject);
router.post('/teacher/marks', teacherGuard, teacherController.submitOrUpdateMarks);
router.get('/teacher/timetable', teacherGuard, teacherController.getTeacherTimetable);
router.put('/teacher/profile', teacherGuard, teacherController.updateTeacherProfile);

// ==================== STUDENT ONLY ROUTES ====================
const studentGuard = requireRole(['STUDENT']);

router.get('/student/dashboard', studentGuard, studentController.getStudentDashboard);
router.get('/student/attendance', studentGuard, studentController.getStudentAttendanceDetails);
router.get('/student/results', studentGuard, studentController.getStudentResults);
router.get('/student/timetable', studentGuard, studentController.getStudentTimetable);
router.get('/student/resources', studentGuard, studentController.getStudentResources);
router.put('/student/profile', studentGuard, studentController.updateStudentProfile);

export default router;
