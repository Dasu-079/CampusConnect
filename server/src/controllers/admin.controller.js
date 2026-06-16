import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import csvParser from 'csv-parser';

const prisma = new PrismaClient();

// ==================== STUDENTS ====================
export const getStudents = async (req, res) => {
  const { search, branch, semester } = req.query;
  try {
    const filters = {};
    if (branch) filters.branch = branch;
    if (semester) filters.semester = parseInt(semester);
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { regNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where: filters,
      include: {
        user: {
          select: { isActive: true, isPasswordTemp: true }
        }
      },
      orderBy: { regNumber: 'asc' },
    });
    return res.json(students);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching students.' });
  }
};

export const createStudent = async (req, res) => {
  const { regNumber, name, branch, semester, email, mobile } = req.body;

  if (!regNumber || !name || !branch || !semester) {
    return res.status(400).json({ message: 'Registration number, name, branch, and semester are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username: regNumber } });
    if (existing) {
      return res.status(400).json({ message: 'Registration number already exists.' });
    }

    const passwordHash = await bcrypt.hash(regNumber, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: regNumber,
          passwordHash,
          role: 'STUDENT',
          isPasswordTemp: true,
        },
      });

      const student = await tx.student.create({
        data: {
          regNumber,
          name,
          branch,
          semester: parseInt(semester),
          email,
          mobile,
          userId: user.id,
        },
      });

      return student;
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating student.' });
  }
};

export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, branch, semester, email, mobile } = req.body;

  try {
    const updated = await prisma.student.update({
      where: { id: parseInt(id) },
      data: {
        name,
        branch,
        semester: semester ? parseInt(semester) : undefined,
        email,
        mobile,
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating student.' });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await prisma.student.findUnique({ where: { id: parseInt(id) } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id: student.id } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    return res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting student.' });
  }
};

export const resetStudentPassword = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await prisma.student.findUnique({ where: { id: parseInt(id) } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const defaultHash = await bcrypt.hash(student.regNumber, 10);
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        passwordHash: defaultHash,
        isPasswordTemp: true,
      },
    });

    return res.json({ message: 'Student password reset to registration number.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error resetting password.' });
  }
};

export const toggleUserStatus = async (req, res) => {
  const { userId } = req.body;
  const { active } = req.body; // boolean

  try {
    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { isActive: active },
    });
    return res.json({ message: `Account ${active ? 'activated' : 'deactivated'} successfully.`, user: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error toggling user status.' });
  }
};

export const bulkImportStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file.' });
  }

  const studentsToInsert = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => {
      // Columns: regNumber, name, branch, semester, email, mobile
      if (row.regNumber && row.name && row.branch && row.semester) {
        studentsToInsert.push({
          regNumber: row.regNumber.trim(),
          name: row.name.trim(),
          branch: row.branch.trim(),
          semester: parseInt(row.semester.trim()),
          email: row.email ? row.email.trim() : null,
          mobile: row.mobile ? row.mobile.trim() : null,
        });
      }
    })
    .on('end', async () => {
      try {
        let successCount = 0;
        let failCount = 0;

        for (const s of studentsToInsert) {
          const existing = await prisma.user.findUnique({ where: { username: s.regNumber } });
          if (existing) {
            failCount++;
            continue;
          }

          const passwordHash = await bcrypt.hash(s.regNumber, 10);

          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                username: s.regNumber,
                passwordHash,
                role: 'STUDENT',
                isPasswordTemp: true,
              },
            });

            await tx.student.create({
              data: {
                regNumber: s.regNumber,
                name: s.name,
                branch: s.branch,
                semester: s.semester,
                email: s.email,
                mobile: s.mobile,
                userId: user.id,
              },
            });
          });
          successCount++;
        }

        fs.unlinkSync(filePath); // delete temp file
        return res.json({
          message: `Import completed. Successful: ${successCount}, Skipped/Duplicates: ${failCount}`,
        });
      } catch (err) {
        console.error(err);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ message: 'Error during bulk import database operations.' });
      }
    })
    .on('error', (err) => {
      console.error(err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(500).json({ message: 'Error parsing CSV file.' });
    });
};

// ==================== TEACHERS ====================
export const getTeachers = async (req, res) => {
  const { search, branch } = req.query;
  try {
    const filters = {};
    if (branch) filters.branch = branch;
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { facultyId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where: filters,
      include: {
        user: { select: { isActive: true } },
        teacherSubjects: {
          include: { subject: true },
        },
      },
      orderBy: { facultyId: 'asc' },
    });
    return res.json(teachers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching teachers.' });
  }
};

export const createTeacher = async (req, res) => {
  const { facultyId, name, branch, email, mobile } = req.body;

  if (!facultyId || !name || !branch) {
    return res.status(400).json({ message: 'Faculty ID, name, and department branch are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username: facultyId } });
    if (existing) {
      return res.status(400).json({ message: 'Faculty ID already exists.' });
    }

    const passwordHash = await bcrypt.hash(facultyId, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: facultyId,
          passwordHash,
          role: 'TEACHER',
          isPasswordTemp: true,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          facultyId,
          name,
          branch,
          email,
          mobile,
          userId: user.id,
        },
      });

      return teacher;
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating teacher.' });
  }
};

export const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, branch, email, mobile } = req.body;

  try {
    const updated = await prisma.teacher.update({
      where: { id: parseInt(id) },
      data: { name, branch, email, mobile },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating teacher.' });
  }
};

export const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: parseInt(id) } });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.teacher.delete({ where: { id: teacher.id } });
      await tx.user.delete({ where: { id: teacher.userId } });
    });

    return res.json({ message: 'Teacher deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting teacher.' });
  }
};

export const resetTeacherPassword = async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: parseInt(id) } });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    const defaultHash = await bcrypt.hash(teacher.facultyId, 10);
    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        passwordHash: defaultHash,
        isPasswordTemp: true,
      },
    });

    return res.json({ message: 'Teacher password reset to Faculty ID.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error resetting password.' });
  }
};

export const assignTeacherSubjects = async (req, res) => {
  const { teacherId, subjectIds } = req.body; // array of ids

  if (!teacherId || !Array.isArray(subjectIds)) {
    return res.status(400).json({ message: 'Teacher ID and subject IDs array are required.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // delete existing assignments
      await tx.teacherSubject.deleteMany({ where: { teacherId: parseInt(teacherId) } });

      // create new ones
      const data = subjectIds.map((subId) => ({
        teacherId: parseInt(teacherId),
        subjectId: parseInt(subId),
      }));

      await tx.teacherSubject.createMany({ data });
    });

    return res.json({ message: 'Subjects assigned successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error assigning subjects.' });
  }
};

// ==================== DEPARTMENTS ====================
export const getDepartments = async (req, res) => {
  try {
    const depts = await prisma.department.findMany({ orderBy: { code: 'asc' } });
    return res.json(depts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching departments.' });
  }
};

export const createDepartment = async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ message: 'Name and Code are required.' });

  try {
    const newDept = await prisma.department.create({ data: { name, code } });
    return res.status(201).json(newDept);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating department.' });
  }
};

export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, code } = req.body;
  try {
    const updated = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name, code },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating department.' });
  }
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.department.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting department.' });
  }
};

// ==================== SUBJECTS ====================
export const getSubjects = async (req, res) => {
  const { branch, semester } = req.query;
  try {
    const filters = {};
    if (branch) filters.branch = branch;
    if (semester) filters.semester = parseInt(semester);

    const subjects = await prisma.subject.findMany({
      where: filters,
      orderBy: { code: 'asc' },
    });
    return res.json(subjects);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching subjects.' });
  }
};

export const createSubject = async (req, res) => {
  const { code, name, branch, semester } = req.body;
  if (!code || !name || !branch || !semester) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const newSub = await prisma.subject.create({
      data: { code, name, branch, semester: parseInt(semester) },
    });
    return res.status(201).json(newSub);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Subject code must be unique.' });
  }
};

export const updateSubject = async (req, res) => {
  const { id } = req.params;
  const { code, name, branch, semester } = req.body;
  try {
    const updated = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: { code, name, branch, semester: semester ? parseInt(semester) : undefined },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating subject.' });
  }
};

export const deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.subject.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Subject deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting subject.' });
  }
};

// ==================== CLASSROOMS ====================
export const getClassrooms = async (req, res) => {
  try {
    const rooms = await prisma.classroom.findMany({ orderBy: { roomName: 'asc' } });
    return res.json(rooms);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching classrooms.' });
  }
};

export const createClassroom = async (req, res) => {
  const { roomName, capacity } = req.body;
  if (!roomName || !capacity) return res.status(400).json({ message: 'Room name and capacity are required.' });

  try {
    const newRoom = await prisma.classroom.create({
      data: { roomName, capacity: parseInt(capacity) },
    });
    return res.status(201).json(newRoom);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Room name must be unique.' });
  }
};

export const deleteClassroom = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.classroom.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Classroom deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting classroom.' });
  }
};

// ==================== SCHOLARSHIPS ====================
export const getScholarships = async (req, res) => {
  try {
    const s = await prisma.scholarship.findMany({ orderBy: { lastDate: 'asc' } });
    return res.json(s);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching scholarships.' });
  }
};

export const createScholarship = async (req, res) => {
  const { name, eligibility, lastDate, link, status } = req.body;
  try {
    const newS = await prisma.scholarship.create({
      data: {
        name,
        eligibility,
        lastDate: new Date(lastDate),
        link,
        status: status || 'ACTIVE',
      },
    });
    return res.status(201).json(newS);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating scholarship.' });
  }
};

export const updateScholarship = async (req, res) => {
  const { id } = req.params;
  const { name, eligibility, lastDate, link, status } = req.body;
  try {
    const updated = await prisma.scholarship.update({
      where: { id: parseInt(id) },
      data: {
        name,
        eligibility,
        lastDate: lastDate ? new Date(lastDate) : undefined,
        link,
        status,
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating scholarship.' });
  }
};

export const deleteScholarship = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.scholarship.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Scholarship deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting scholarship.' });
  }
};

// ==================== ANNOUNCEMENTS ====================
export const getAnnouncements = async (req, res) => {
  const { category, search } = req.query;
  try {
    const filters = {};
    if (category) filters.category = category;
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    const notices = await prisma.announcement.findMany({
      where: filters,
      orderBy: { publishDate: 'desc' },
      include: { author: { select: { username: true } } },
    });
    return res.json(notices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching announcements.' });
  }
};

export const createAnnouncement = async (req, res) => {
  const { title, content, category, priority } = req.body;
  const authorId = req.user.id;

  if (!title || !content || !category || !priority) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const newNotice = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        priority,
        authorId,
      },
    });
    return res.status(201).json(newNotice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating announcement.' });
  }
};

export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.announcement.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting announcement.' });
  }
};

// ==================== TRANSPORT ====================
export const getRoutes = async (req, res) => {
  const { search, busType } = req.query;
  try {
    const filters = {};
    if (busType) filters.busType = busType;
    if (search) {
      filters.OR = [
        { source: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
        { routeNumber: { contains: search, mode: 'insensitive' } },
        { stops: { contains: search, mode: 'insensitive' } },
      ];
    }

    const routes = await prisma.transportRoute.findMany({
      where: filters,
      orderBy: { routeNumber: 'asc' },
    });
    return res.json(routes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching routes.' });
  }
};

export const createRoute = async (req, res) => {
  const { routeNumber, source, destination, departureTime, arrivalTime, stops, busType } = req.body;
  if (!routeNumber || !source || !destination || !departureTime || !arrivalTime || !stops || !busType) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const newRoute = await prisma.transportRoute.create({
      data: { routeNumber, source, destination, departureTime, arrivalTime, stops, busType },
    });
    return res.status(201).json(newRoute);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Route number must be unique.' });
  }
};

export const updateRoute = async (req, res) => {
  const { id } = req.params;
  const { routeNumber, source, destination, departureTime, arrivalTime, stops, busType } = req.body;
  try {
    const updated = await prisma.transportRoute.update({
      where: { id: parseInt(id) },
      data: { routeNumber, source, destination, departureTime, arrivalTime, stops, busType },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating route.' });
  }
};

export const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.transportRoute.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Route deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting route.' });
  }
};

// ==================== RESOURCES ====================
export const getResources = async (req, res) => {
  const { subjectId } = req.query;
  try {
    const filters = {};
    if (subjectId) filters.subjectId = parseInt(subjectId);

    const r = await prisma.resource.findMany({
      where: filters,
      include: { subject: true },
      orderBy: { name: 'asc' },
    });
    return res.json(r);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching resources.' });
  }
};

export const createResource = async (req, res) => {
  const { name, type, url, subjectId } = req.body;
  if (!name || !type || !url || !subjectId) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const newR = await prisma.resource.create({
      data: {
        name,
        type,
        url,
        subjectId: parseInt(subjectId),
      },
    });
    return res.status(201).json(newR);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating resource.' });
  }
};

export const deleteResource = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.resource.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Resource deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting resource.' });
  }
};

// ==================== DASHBOARD METRICS ====================
export const getAdminMetrics = async (req, res) => {
  try {
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalDepartments = await prisma.department.count();
    const totalSubjects = await prisma.subject.count();

    // Department-wise student counts
    const students = await prisma.student.findMany({ select: { branch: true } });
    const deptStats = {};
    students.forEach((s) => {
      deptStats[s.branch] = (deptStats[s.branch] || 0) + 1;
    });

    const formattedDeptStats = Object.keys(deptStats).map((branch) => ({
      branch,
      count: deptStats[branch],
    }));

    // Overall Attendance metrics
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return res.json({
      totalStudents,
      totalTeachers,
      totalDepartments,
      totalSubjects,
      departmentStats: formattedDeptStats,
      attendanceStats,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching metrics.' });
  }
};
