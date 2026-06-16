import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get full college timetable (can filter by branch/sem)
export const getFullTimetable = async (req, res) => {
  const { branch, semester } = req.query;
  try {
    const filters = {};
    if (branch) filters.branch = branch;
    if (semester) filters.semester = parseInt(semester);

    const schedule = await prisma.timetable.findMany({
      where: filters,
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
    return res.json(schedule);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching timetable.' });
  }
};

// Validate individual schedule for conflicts
const detectConflicts = async ({ id, dayOfWeek, periodNumber, teacherId, classroomId, branch, semester, subjectId }) => {
  const conflicts = [];

  // 1. Teacher Conflict: Is this teacher already teaching another class at this time?
  const teacherConflict = await prisma.timetable.findFirst({
    where: {
      dayOfWeek,
      periodNumber,
      teacherId,
      NOT: id ? { id: parseInt(id) } : undefined,
    },
    include: {
      teacher: true,
      subject: true,
    },
  });

  if (teacherConflict) {
    conflicts.push(`Teacher ${teacherConflict.teacher.name} is already assigned to ${teacherConflict.branch} (Sem-${teacherConflict.semester}) for ${teacherConflict.subject.name} at Period ${periodNumber} on ${dayOfWeek}.`);
  }

  // 2. Classroom Conflict: Is this room already occupied at this time?
  const classroomConflict = await prisma.timetable.findFirst({
    where: {
      dayOfWeek,
      periodNumber,
      classroomId,
      NOT: id ? { id: parseInt(id) } : undefined,
    },
    include: {
      classroom: true,
    },
  });

  if (classroomConflict) {
    conflicts.push(`Classroom ${classroomConflict.classroom.roomName} is already occupied by ${classroomConflict.branch} (Sem-${classroomConflict.semester}) at Period ${periodNumber} on ${dayOfWeek}.`);
  }

  // 3. Class Slot Conflict: Does this branch and semester already have a subject at this time?
  const slotConflict = await prisma.timetable.findFirst({
    where: {
      dayOfWeek,
      periodNumber,
      branch,
      semester,
      NOT: id ? { id: parseInt(id) } : undefined,
    },
    include: {
      subject: true,
    },
  });

  if (slotConflict) {
    conflicts.push(`Branch ${branch} Sem-${semester} already has ${slotConflict.subject.name} scheduled at Period ${periodNumber} on ${dayOfWeek}.`);
  }

  // 4. Lunch break conflict (Period 4 is normally lunch time: 1:00 PM to 2:00 PM, let's say period 4 is reserved, or we raise a warning if desired. Typically diploma timetable has 3 periods morning, 1 hour lunch, 3 periods afternoon. If period 4 is defined, let's keep it open, but we can return warning)

  return conflicts;
};

// Create a timetable slot
export const createTimetableSlot = async (req, res) => {
  const { dayOfWeek, periodNumber, subjectId, teacherId, classroomId, semester, branch } = req.body;

  if (!dayOfWeek || !periodNumber || !subjectId || !teacherId || !classroomId || !semester || !branch) {
    return res.status(400).json({ message: 'All slot fields are required.' });
  }

  try {
    // Check conflicts
    const conflicts = await detectConflicts({
      dayOfWeek,
      periodNumber: parseInt(periodNumber),
      subjectId: parseInt(subjectId),
      teacherId: parseInt(teacherId),
      classroomId: parseInt(classroomId),
      branch,
      semester: parseInt(semester),
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Conflict detected', conflicts });
    }

    const newSlot = await prisma.timetable.create({
      data: {
        dayOfWeek,
        periodNumber: parseInt(periodNumber),
        subjectId: parseInt(subjectId),
        teacherId: parseInt(teacherId),
        classroomId: parseInt(classroomId),
        semester: parseInt(semester),
        branch,
      },
    });

    return res.status(201).json(newSlot);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating timetable slot.' });
  }
};

// Update a timetable slot
export const updateTimetableSlot = async (req, res) => {
  const { id } = req.params;
  const { dayOfWeek, periodNumber, subjectId, teacherId, classroomId, semester, branch } = req.body;

  try {
    // Check conflicts
    const conflicts = await detectConflicts({
      id,
      dayOfWeek,
      periodNumber: parseInt(periodNumber),
      subjectId: parseInt(subjectId),
      teacherId: parseInt(teacherId),
      classroomId: parseInt(classroomId),
      branch,
      semester: parseInt(semester),
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Conflict detected', conflicts });
    }

    const updated = await prisma.timetable.update({
      where: { id: parseInt(id) },
      data: {
        dayOfWeek,
        periodNumber: parseInt(periodNumber),
        subjectId: parseInt(subjectId),
        teacherId: parseInt(teacherId),
        classroomId: parseInt(classroomId),
        semester: parseInt(semester),
        branch,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating timetable slot.' });
  }
};

// Delete a timetable slot
export const deleteTimetableSlot = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.timetable.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Timetable slot deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting timetable slot.' });
  }
};

// Automatically generate a full timetable for all branches/semesters with no conflicts
export const autoGenerateTimetable = async (req, res) => {
  try {
    // Clear all existing timetables first
    await prisma.timetable.deleteMany();

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const branches = ['CSE', 'ECE', 'EEE', 'Civil', 'Mechanical'];
    const semesters = [1, 3, 5];
    const classrooms = await prisma.classroom.findMany();
    const teachers = await prisma.teacher.findMany({
      include: { teacherSubjects: true },
    });

    if (classrooms.length === 0 || teachers.length === 0) {
      return res.status(400).json({ message: 'Must have classrooms and teachers created to auto-generate.' });
    }

    let createdCount = 0;

    // A simple, greedy back-off scheduler
    for (const branch of branches) {
      for (const semester of semesters) {
        const branchSemesterSubjects = await prisma.subject.findMany({
          where: { branch, semester },
        });

        if (branchSemesterSubjects.length === 0) continue;

        let subjectIndex = 0;

        for (const day of days) {
          // Schedule 5 periods (avoid period 4 as lunch or just schedule 5 periods: 1, 2, 3, 5, 6)
          const periods = [1, 2, 3, 5, 6]; 
          
          for (const period of periods) {
            // Pick subject
            const subject = branchSemesterSubjects[subjectIndex % branchSemesterSubjects.length];
            subjectIndex++;

            // Find teacher who can teach this subject
            const eligibleTeachers = teachers.filter((t) =>
              t.teacherSubjects.some((ts) => ts.subjectId === subject.id)
            );

            if (eligibleTeachers.length === 0) continue;

            // Try to find a teacher and classroom that are free at this day and period
            let assigned = false;
            for (const teacher of eligibleTeachers) {
              for (const classroom of classrooms) {
                // Check if teacher and classroom are free
                const conflictCount = await prisma.timetable.count({
                  where: {
                    dayOfWeek: day,
                    periodNumber: period,
                    OR: [
                      { teacherId: teacher.id },
                      { classroomId: classroom.id },
                      { branch, semester },
                    ],
                  },
                });

                if (conflictCount === 0) {
                  // Create schedule slot
                  await prisma.timetable.create({
                    data: {
                      dayOfWeek: day,
                      periodNumber: period,
                      subjectId: subject.id,
                      teacherId: teacher.id,
                      classroomId: classroom.id,
                      semester,
                      branch,
                    },
                  });
                  createdCount++;
                  assigned = true;
                  break;
                }
              }
              if (assigned) break;
            }
          }
        }
      }
    }

    return res.json({ message: `Successfully auto-generated ${createdCount} conflict-free schedule periods.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error generating timetable.' });
  }
};

// Validate the entire college timetable database for conflicts
export const validateAllSchedules = async (req, res) => {
  try {
    const allSlots = await prisma.timetable.findMany({
      include: {
        teacher: true,
        subject: true,
        classroom: true,
      },
    });

    const conflictsList = [];

    for (let i = 0; i < allSlots.length; i++) {
      const current = allSlots[i];
      for (let j = i + 1; j < allSlots.length; j++) {
        const other = allSlots[j];

        if (current.dayOfWeek === other.dayOfWeek && current.periodNumber === other.periodNumber) {
          // Teacher clash
          if (current.teacherId === other.teacherId) {
            conflictsList.push({
              slot1: current,
              slot2: other,
              type: 'TEACHER_CLASH',
              description: `Teacher ${current.teacher.name} is scheduled for both ${current.branch} Sem-${current.semester} and ${other.branch} Sem-${other.semester} on ${current.dayOfWeek} Period ${current.periodNumber}.`,
            });
          }
          // Classroom clash
          if (current.classroomId === other.classroomId) {
            conflictsList.push({
              slot1: current,
              slot2: other,
              type: 'CLASSROOM_CLASH',
              description: `Classroom ${current.classroom.roomName} is occupied by both ${current.branch} Sem-${current.semester} and ${other.branch} Sem-${other.semester} on ${current.dayOfWeek} Period ${current.periodNumber}.`,
            });
          }
          // Class overlap (same class twice)
          if (current.branch === other.branch && current.semester === other.semester) {
            conflictsList.push({
              slot1: current,
              slot2: other,
              type: 'CLASS_OVERLAP',
              description: `Branch ${current.branch} Sem-${current.semester} has both ${current.subject.name} and ${other.subject.name} scheduled on ${current.dayOfWeek} Period ${current.periodNumber}.`,
            });
          }
        }
      }
    }

    return res.json({
      isValid: conflictsList.length === 0,
      conflicts: conflictsList,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error validating timetables.' });
  }
};
