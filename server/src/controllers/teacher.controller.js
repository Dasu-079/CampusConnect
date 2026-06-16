import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAssignedSubjects = async (req, res) => {
  const userId = req.user.id;
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    return res.json(teacher.teacherSubjects.map((ts) => ts.subject));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching assigned subjects.' });
  }
};

export const getStudentsBySubject = async (req, res) => {
  const { subjectId } = req.query;

  if (!subjectId) {
    return res.status(400).json({ message: 'Subject ID is required.' });
  }

  try {
    const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    // Find all students in this branch and semester
    const students = await prisma.student.findMany({
      where: {
        branch: subject.branch,
        semester: subject.semester,
      },
      orderBy: { regNumber: 'asc' },
    });

    return res.json(students);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching class list.' });
  }
};

export const getAttendanceList = async (req, res) => {
  const { subjectId, date } = req.query;

  if (!subjectId || !date) {
    return res.status(400).json({ message: 'Subject ID and Date are required.' });
  }

  try {
    const targetDate = new Date(date);
    // Start and end of that specific day
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        subjectId: parseInt(subjectId),
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { student: true },
    });

    return res.json(attendanceRecords);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching attendance records.' });
  }
};

export const submitOrUpdateAttendance = async (req, res) => {
  const { subjectId, date, records } = req.body; // records: Array of { studentId, status: 'PRESENT'|'ABSENT' }
  const userId = req.user.id;

  if (!subjectId || !date || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Subject ID, date, and attendance records are required.' });
  }

  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

    await prisma.$transaction(async (tx) => {
      // Clear existing records for this day and subject
      await tx.attendance.deleteMany({
        where: {
          subjectId: parseInt(subjectId),
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      // Insert new records
      const insertData = records.map((rec) => ({
        date: targetDate,
        status: rec.status,
        studentId: parseInt(rec.studentId),
        subjectId: parseInt(subjectId),
        teacherId: teacher.id,
      }));

      await tx.attendance.createMany({ data: insertData });
    });

    return res.json({ message: 'Attendance updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error saving attendance.' });
  }
};

export const submitOrUpdateMarks = async (req, res) => {
  const { studentId, subjectId, internalMarks, assignmentMarks, labMarks, examSemester } = req.body;

  if (!studentId || !subjectId) {
    return res.status(400).json({ message: 'Student ID and Subject ID are required.' });
  }

  try {
    const sub = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
    if (!sub) return res.status(404).json({ message: 'Subject not found.' });

    const result = await prisma.result.upsert({
      where: {
        studentId_subjectId: {
          studentId: parseInt(studentId),
          subjectId: parseInt(subjectId),
        },
      },
      update: {
        internalMarks: parseFloat(internalMarks || 0),
        assignmentMarks: parseFloat(assignmentMarks || 0),
        labMarks: parseFloat(labMarks || 0),
        examSemester: parseInt(examSemester || sub.semester),
      },
      create: {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId),
        internalMarks: parseFloat(internalMarks || 0),
        assignmentMarks: parseFloat(assignmentMarks || 0),
        labMarks: parseFloat(labMarks || 0),
        examSemester: parseInt(examSemester || sub.semester),
      },
    });

    return res.json({ message: 'Marks updated successfully.', result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error saving marks.' });
  }
};

export const getMarksListBySubject = async (req, res) => {
  const { subjectId } = req.query;

  if (!subjectId) {
    return res.status(400).json({ message: 'Subject ID is required.' });
  }

  try {
    const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });

    // Fetch students
    const students = await prisma.student.findMany({
      where: { branch: subject.branch, semester: subject.semester },
      orderBy: { regNumber: 'asc' },
    });

    // Fetch existing results
    const results = await prisma.result.findMany({
      where: { subjectId: parseInt(subjectId) },
    });

    const resultsMap = {};
    results.forEach((r) => {
      resultsMap[r.studentId] = r;
    });

    const data = students.map((s) => ({
      studentId: s.id,
      name: s.name,
      regNumber: s.regNumber,
      marks: resultsMap[s.id] || {
        internalMarks: 0,
        assignmentMarks: 0,
        labMarks: 0,
      },
    }));

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching marks.' });
  }
};

export const getTeacherTimetable = async (req, res) => {
  const userId = req.user.id;
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const timetable = await prisma.timetable.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        classroom: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { periodNumber: 'asc' },
      ],
    });

    return res.json(timetable);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching teacher timetable.' });
  }
};

export const updateTeacherProfile = async (req, res) => {
  const userId = req.user.id;
  const { email, mobile } = req.body;

  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

    const updated = await prisma.teacher.update({
      where: { id: teacher.id },
      data: { email, mobile },
    });

    return res.json({ message: 'Profile updated successfully.', teacher: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating profile.' });
  }
};
