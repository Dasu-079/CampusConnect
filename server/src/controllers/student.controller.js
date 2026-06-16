import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStudentDashboard = async (req, res) => {
  const userId = req.user.id;
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Attendance stats
    const totalClasses = await prisma.attendance.count({
      where: { studentId: student.id },
    });
    const presentClasses = await prisma.attendance.count({
      where: { studentId: student.id, status: 'PRESENT' },
    });
    const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 100;

    // Recent announcements (limit 5)
    const announcements = await prisma.announcement.findMany({
      orderBy: { publishDate: 'desc' },
      take: 5,
    });

    // Upcoming events (e.g., active scholarships, upcoming deadlines)
    const scholarships = await prisma.scholarship.findMany({
      where: { status: 'ACTIVE', lastDate: { gte: new Date() } },
      orderBy: { lastDate: 'asc' },
      take: 3,
    });

    return res.json({
      profile: student,
      attendancePercentage: Math.round(attendancePercentage * 10) / 10,
      totalClasses,
      presentClasses,
      announcements,
      upcomingScholarships: scholarships,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching student dashboard.' });
  }
};

export const getStudentAttendanceDetails = async (req, res) => {
  const userId = req.user.id;
  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // Subject-wise attendance breakdown
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { subject: true },
    });

    const breakdown = {};
    attendanceRecords.forEach((record) => {
      const subCode = record.subject.code;
      if (!breakdown[subCode]) {
        breakdown[subCode] = {
          subjectCode: subCode,
          subjectName: record.subject.name,
          total: 0,
          present: 0,
        };
      }
      breakdown[subCode].total++;
      if (record.status === 'PRESENT') {
        breakdown[subCode].present++;
      }
    });

    const subjectsList = Object.values(breakdown).map((sub) => ({
      ...sub,
      percentage: sub.total > 0 ? Math.round((sub.present / sub.total) * 100) : 100,
    }));

    return res.json({
      records: attendanceRecords,
      subjectWiseBreakdown: subjectsList,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching attendance details.' });
  }
};

export const getStudentResults = async (req, res) => {
  const userId = req.user.id;
  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const results = await prisma.result.findMany({
      where: { studentId: student.id },
      include: { subject: true },
    });

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching results.' });
  }
};

export const getStudentTimetable = async (req, res) => {
  const userId = req.user.id;
  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const timetable = await prisma.timetable.findMany({
      where: {
        branch: student.branch,
        semester: student.semester,
      },
      include: {
        subject: true,
        teacher: true,
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
    return res.status(500).json({ message: 'Error fetching student timetable.' });
  }
};

export const getStudentResources = async (req, res) => {
  const userId = req.user.id;
  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // Fetch resources belonging to the student's branch subjects
    const resources = await prisma.resource.findMany({
      where: {
        subject: {
          branch: student.branch,
        },
      },
      include: { subject: true },
      orderBy: { subject: { code: 'asc' } },
    });

    return res.json(resources);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching student resources.' });
  }
};

export const updateStudentProfile = async (req, res) => {
  const userId = req.user.id;
  const { email, mobile, profilePic } = req.body;

  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        email,
        mobile,
        profilePic: profilePic || student.profilePic,
      },
    });

    return res.json({ message: 'Profile updated successfully.', student: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating profile.' });
  }
};
