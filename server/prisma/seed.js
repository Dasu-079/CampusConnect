import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.timetable.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.transportRoute.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.result.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.department.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // 1. Create Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isPasswordTemp: false,
    },
  });
  console.log('Admin user created.');

  // 2. Create Departments
  const departmentsData = [
    { code: 'CSE', name: 'Computer Engineering' },
    { code: 'ECE', name: 'Electronics & Communication Engineering' },
    { code: 'EEE', name: 'Electrical & Electronics Engineering' },
    { code: 'Civil', name: 'Civil Engineering' },
    { code: 'Mechanical', name: 'Mechanical Engineering' },
  ];

  const depts = {};
  for (const dept of departmentsData) {
    depts[dept.code] = await prisma.department.create({
      data: dept,
    });
  }
  console.log('Departments created.');

  // 3. Create Subjects
  const subjectsData = [
    // CSE
    { code: 'CS101', name: 'Programming in C', branch: 'CSE', semester: 1 },
    { code: 'CS102', name: 'Data Structures', branch: 'CSE', semester: 2 },
    { code: 'CS201', name: 'C++', branch: 'CSE', semester: 3 },
    { code: 'CS202', name: 'Java', branch: 'CSE', semester: 4 },
    { code: 'CS301', name: 'Python', branch: 'CSE', semester: 5 },
    { code: 'CS302', name: 'DBMS', branch: 'CSE', semester: 5 },
    { code: 'CS303', name: 'Operating Systems', branch: 'CSE', semester: 6 },
    { code: 'CS304', name: 'Computer Networks', branch: 'CSE', semester: 6 },
    { code: 'CS305', name: 'Web Technologies', branch: 'CSE', semester: 6 },
    { code: 'CS306', name: 'Software Engineering', branch: 'CSE', semester: 6 },

    // ECE
    { code: 'EC101', name: 'Electronic Devices and Circuits', branch: 'ECE', semester: 1 },
    { code: 'EC102', name: 'Digital Electronics', branch: 'ECE', semester: 2 },
    { code: 'EC201', name: 'Analog Electronics', branch: 'ECE', semester: 3 },
    { code: 'EC202', name: 'Microcontrollers', branch: 'ECE', semester: 4 },
    { code: 'EC301', name: 'Communication Systems', branch: 'ECE', semester: 5 },
    { code: 'EC302', name: 'Embedded Systems', branch: 'ECE', semester: 6 },

    // EEE
    { code: 'EE101', name: 'Electrical Circuits', branch: 'EEE', semester: 1 },
    { code: 'EE102', name: 'Electrical Machines', branch: 'EEE', semester: 2 },
    { code: 'EE201', name: 'Power Systems', branch: 'EEE', semester: 3 },
    { code: 'EE202', name: 'Control Systems', branch: 'EEE', semester: 4 },
    { code: 'EE301', name: 'Power Electronics', branch: 'EEE', semester: 5 },
    { code: 'EE302', name: 'Switchgear and Protection', branch: 'EEE', semester: 6 },

    // Civil
    { code: 'CE101', name: 'Engineering Mechanics', branch: 'Civil', semester: 1 },
    { code: 'CE102', name: 'Surveying', branch: 'Civil', semester: 2 },
    { code: 'CE201', name: 'Building Materials', branch: 'Civil', semester: 3 },
    { code: 'CE202', name: 'Structural Engineering', branch: 'Civil', semester: 4 },
    { code: 'CE301', name: 'RCC Design', branch: 'Civil', semester: 5 },
    { code: 'CE302', name: 'Estimation and Costing', branch: 'Civil', semester: 6 },

    // Mechanical
    { code: 'ME101', name: 'Engineering Mechanics', branch: 'Mechanical', semester: 1 },
    { code: 'ME102', name: 'Thermodynamics', branch: 'Mechanical', semester: 2 },
    { code: 'ME201', name: 'Manufacturing Technology', branch: 'Mechanical', semester: 3 },
    { code: 'ME202', name: 'Fluid Mechanics', branch: 'Mechanical', semester: 4 },
    { code: 'ME301', name: 'Machine Design', branch: 'Mechanical', semester: 5 },
    { code: 'ME302', name: 'Automobile Engineering', branch: 'Mechanical', semester: 6 },
  ];

  const dbSubjects = [];
  for (const sub of subjectsData) {
    const s = await prisma.subject.create({ data: sub });
    dbSubjects.push(s);
  }
  console.log('Subjects created.');

  // 4. Create Classrooms
  const classroomsData = [
    { roomName: 'Room-101', capacity: 60 },
    { roomName: 'Room-102', capacity: 60 },
    { roomName: 'Room-103', capacity: 60 },
    { roomName: 'LH-01', capacity: 80 },
    { roomName: 'LH-02', capacity: 80 },
    { roomName: 'Drawing Hall-1', capacity: 70 },
    { roomName: 'CSE-Lab-1', capacity: 40 },
    { roomName: 'ECE-Lab-1', capacity: 40 },
    { roomName: 'EEE-Lab-1', capacity: 40 },
  ];

  const dbClassrooms = [];
  for (const cr of classroomsData) {
    const c = await prisma.classroom.create({ data: cr });
    dbClassrooms.push(c);
  }
  console.log('Classrooms created.');

  // 5. Create 15 Teachers (3 per branch)
  const branches = ['CSE', 'ECE', 'EEE', 'Civil', 'Mechanical'];
  const teachers = [];

  const teacherNames = [
    // CSE
    { name: 'Dr. K. Srinivas Rao', branch: 'CSE', fid: 'T101' },
    { name: 'Mrs. P. Radhika', branch: 'CSE', fid: 'T102' },
    { name: 'Mr. J. Anil Kumar', branch: 'CSE', fid: 'T103' },
    // ECE
    { name: 'Dr. G. Venkat Ramana', branch: 'ECE', fid: 'T104' },
    { name: 'Mrs. D. Lakshmi', branch: 'ECE', fid: 'T105' },
    { name: 'Mr. M. Rajesh', branch: 'ECE', fid: 'T106' },
    // EEE
    { name: 'Mr. V. Satish Kumar', branch: 'EEE', fid: 'T107' },
    { name: 'Mrs. T. Sandhya', branch: 'EEE', fid: 'T108' },
    { name: 'Mr. B. Nageswara Rao', branch: 'EEE', fid: 'T109' },
    // Civil
    { name: 'Dr. S. K. Rahaman', branch: 'Civil', fid: 'T110' },
    { name: 'Mrs. K. Vijaya Lakshmi', branch: 'Civil', fid: 'T111' },
    { name: 'Mr. Ch. Rama Rao', branch: 'Civil', fid: 'T112' },
    // Mechanical
    { name: 'Mr. Y. Hari Prasad', branch: 'Mechanical', fid: 'T113' },
    { name: 'Mrs. A. Anuradha', branch: 'Mechanical', fid: 'T114' },
    { name: 'Mr. G. Ravi Teja', branch: 'Mechanical', fid: 'T115' },
  ];

  for (const t of teacherNames) {
    const pHash = await bcrypt.hash(t.fid, 10); // default password = Faculty ID
    const user = await prisma.user.create({
      data: {
        username: t.fid,
        passwordHash: pHash,
        role: 'TEACHER',
        isPasswordTemp: true,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        facultyId: t.fid,
        name: t.name,
        branch: t.branch,
        email: `${t.name.toLowerCase().replace(/[^a-z]/g, '')}@gdc.edu.in`,
        mobile: `98765${Math.floor(10000 + Math.random() * 90000)}`,
        userId: user.id,
      },
    });

    // Assign subjects of their branch
    const branchSubs = dbSubjects.filter((s) => s.branch === t.branch);
    for (const sub of branchSubs) {
      await prisma.teacherSubject.create({
        data: {
          teacherId: teacher.id,
          subjectId: sub.id,
        },
      });
    }
    teachers.push(teacher);
  }
  console.log('15 Teachers created.');

  // 6. Create 100 Students (20 per department, distributed across Semesters 1, 3, 5)
  const studentNames = {
    CSE: [
      'Aarav Sharma', 'Aditi Rao', 'Alok Verma', 'Amit Patel', 'Ananya Sen', 
      'Ankit Gupta', 'Arjun Reddy', 'Bhavna Joshi', 'Chaitanya Kumar', 'Deepak Singh', 
      'Divya Teja', 'Ganesh Naik', 'Harini Rao', 'Ishaan Vyas', 'Jyothi Prasad', 
      'Karan Johar', 'Kavya Madhavan', 'Manoj Gowda', 'Neha Deshmukh', 'Pavan Kalyan'
    ],
    ECE: [
      'Pooja Hegde', 'Pranav Anand', 'Rahul Dravid', 'Riya Sen', 'Rohan Bopanna', 
      'Sai Kiran', 'Sanjay Dutt', 'Shreya Ghoshal', 'Siddharth Roy', 'Sneha Reddy', 
      'Suraj Kumar', 'Tanvi Shah', 'Uday Kiran', 'Varun Dhawan', 'Vijay Devarakonda', 
      'Vinay Kumar', 'Yasmin Begum', 'Zayn Malik', 'Abhinav Bindra', 'Aishwarya Rai'
    ],
    EEE: [
      'Akash Chopra', 'Amrita Rao', 'Anil Kumble', 'Archana Puran', 'Bipasha Basu', 
      'Chandra Sekhar', 'Devendra Fadnavis', 'Gita Gopinath', 'Hari Krishna', 'Indira Priyadarshini', 
      'Javed Akhtar', 'Kriti Sanon', 'Lata Mangeshkar', 'Mohan Lal', 'Nagarjuna Akkineni', 
      'Prabhas Raju', 'Ram Charan', 'Srinivasa Ramanujan', 'Tarun Sagar', 'Venkatesh Daggubati'
    ],
    Civil: [
      'Allu Arjun', 'Anushka Shetty', 'Bhumi Pednekar', 'Dhanush Raja', 'Esha Gupta', 
      'Farhan Akhtar', 'Gautam Gambhir', 'Hima Das', 'Ileana D\'Cruz', 'Jasprit Bumrah', 
      'Kajal Aggarwal', 'Lokesh Kanagaraj', 'Mahesh Babu', 'Nani Bellamkonda', 'Ojasvi Sharma', 
      'Priya Prakash', 'Rajinikanth Shivaji', 'Samantha Ruth', 'Tamannaah Bhatia', 'Vikram Kennedy'
    ],
    Mechanical: [
      'Akshay Kumar', 'Bobby Deol', 'Chiranjeevi Konidela', 'Dulquer Salmaan', 'Emraan Hashmi', 
      'Fahadh Faasil', 'Govinda Ahuja', 'Hrithik Roshan', 'Imran Khan', 'John Abraham', 
      'Kartik Aaryan', 'Mammootty Panaparambil', 'NTR Rama Rao', 'Prithviraj Sukumaran', 'Ranbir Kapoor', 
      'Suniel Shetty', 'Tiger Shroff', 'Upendra Rao', 'Vicky Kaushal', 'Yash Gowda'
    ],
  };

  const students = [];
  let regCounter = 2001;

  for (const branch of branches) {
    const names = studentNames[branch];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const regNumber = `S${regCounter}`;
      regCounter++;

      const pHash = await bcrypt.hash(regNumber, 10); // default password = registration number
      const user = await prisma.user.create({
        data: {
          username: regNumber,
          passwordHash: pHash,
          role: 'STUDENT',
          isPasswordTemp: true,
        },
      });

      // Distribute semesters: 1st, 3rd, 5th
      let sem = 1;
      if (i >= 7 && i < 14) sem = 3;
      if (i >= 14) sem = 5;

      const student = await prisma.student.create({
        data: {
          regNumber,
          name,
          branch,
          semester: sem,
          email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@student.gdc.edu.in`,
          mobile: `99635${Math.floor(10000 + Math.random() * 90000)}`,
          userId: user.id,
        },
      });
      students.push(student);
    }
  }
  console.log('100 Students created.');

  // 7. Create Attendance Records
  // Create attendance for past 10 days for each student in their subjects
  console.log('Generating attendance records...');
  const activeSemesters = [1, 3, 5];
  const today = new Date();

  // Pick one teacher per branch to assign attendance
  const branchTeachers = {};
  for (const b of branches) {
    branchTeachers[b] = teachers.find((t) => t.branch === b);
  }

  for (const student of students) {
    const branchSubs = dbSubjects.filter(
      (s) => s.branch === student.branch && s.semester === student.semester
    );
    const teacher = branchTeachers[student.branch];

    if (!teacher || branchSubs.length === 0) continue;

    for (const sub of branchSubs) {
      // 10 classes
      for (let day = 1; day <= 10; day++) {
        const classDate = new Date();
        classDate.setDate(today.getDate() - day);
        // Random attendance (85% present rate)
        const status = Math.random() > 0.15 ? 'PRESENT' : 'ABSENT';

        await prisma.attendance.create({
          data: {
            date: classDate,
            status,
            studentId: student.id,
            subjectId: sub.id,
            teacherId: teacher.id,
          },
        });
      }
    }
  }
  console.log('Attendance records generated.');

  // 8. Create Academic Results
  console.log('Generating academic results...');
  for (const student of students) {
    const branchSubs = dbSubjects.filter(
      (s) => s.branch === student.branch && s.semester === student.semester
    );

    for (const sub of branchSubs) {
      // Internal marks: max 20, lab marks: max 50, assignment: max 10
      const internalMarks = Math.floor(10 + Math.random() * 11);
      const assignmentMarks = Math.floor(6 + Math.random() * 5);
      const labMarks = sub.name.toLowerCase().includes('lab') || Math.random() > 0.5
        ? Math.floor(30 + Math.random() * 21)
        : 0;

      await prisma.result.create({
        data: {
          internalMarks,
          assignmentMarks,
          labMarks,
          studentId: student.id,
          subjectId: sub.id,
          examSemester: student.semester,
        },
      });
    }
  }
  console.log('Results records generated.');

  // 9. APSRTC Transport Routes (at least 10 routes)
  console.log('Seeding transport routes...');
  const routesData = [
    { routeNumber: 'R-01', source: 'Vijayawada Bus Station', destination: 'Government Polytechnic', departureTime: '08:00 AM', arrivalTime: '08:45 AM', stops: 'Benz Circle, Ramavarappadu Ring, Prasadampadu', busType: 'Pallevelugu' },
    { routeNumber: 'R-02', source: 'Guntur Bus Stand', destination: 'Government Polytechnic', departureTime: '07:30 AM', arrivalTime: '08:30 AM', stops: 'Pedakakani, Nambur, Mangalagiri', busType: 'Express' },
    { routeNumber: 'R-03', source: 'Eluru', destination: 'Government Polytechnic', departureTime: '07:00 AM', arrivalTime: '08:40 AM', stops: 'Hanuman Junction, Gannavaram', busType: 'Express' },
    { routeNumber: 'R-04', source: 'Kankipadu', destination: 'Government Polytechnic', departureTime: '08:15 AM', arrivalTime: '08:50 AM', stops: 'Poranki, Penamaluru, Tadigadapa', busType: 'Pallevelugu' },
    { routeNumber: 'R-05', source: 'Tenali', destination: 'Government Polytechnic', departureTime: '07:15 AM', arrivalTime: '08:35 AM', stops: 'Kollipara, Penuguduru', busType: 'Deluxe' },
    { routeNumber: 'R-06', source: 'Mangalagiri', destination: 'Government Polytechnic', departureTime: '08:00 AM', arrivalTime: '08:40 AM', stops: 'NRI Hospital, Tadepalli', busType: 'Pallevelugu' },
    { routeNumber: 'R-07', source: 'Gannavaram', destination: 'Government Polytechnic', departureTime: '08:10 AM', arrivalTime: '08:50 AM', stops: 'Kesarapalli, Enikepadu', busType: 'Pallevelugu' },
    { routeNumber: 'R-08', source: 'Nuzvid', destination: 'Government Polytechnic', departureTime: '06:45 AM', arrivalTime: '08:35 AM', stops: 'Vissannapeta, Mylavaram', busType: 'Express' },
    { routeNumber: 'R-09', source: 'Vijayawada Railway Station', destination: 'Government Polytechnic', departureTime: '08:15 AM', arrivalTime: '08:40 AM', stops: 'Governorpet, Chuttugunta, Gunadala', busType: 'Pallevelugu' },
    { routeNumber: 'R-10', source: 'Ibrahimpatnam', destination: 'Government Polytechnic', departureTime: '07:45 AM', arrivalTime: '08:35 AM', stops: 'Gollapudi, Bhavanipuram, RTC Workshop', busType: 'Deluxe' },
  ];

  for (const r of routesData) {
    await prisma.transportRoute.create({ data: r });
  }
  console.log('APSRTC Routes seeded.');

  // 10. Scholarships
  console.log('Seeding scholarships...');
  const scholarshipsData = [
    { name: 'Post Matric Scholarship (Jagananna Vidya Deevena)', eligibility: 'SC, ST, BC, EBC, Minority students pursuing Diploma. Income limit < 2.5 LPA.', lastDate: new Date('2026-09-30'), link: 'https://jnanabhumi.ap.gov.in', status: 'ACTIVE' },
    { name: 'National Scholarship Portal (NSP)', eligibility: 'All students with > 80% marks in 10th standard. Parental income < 2 LPA.', lastDate: new Date('2026-10-15'), link: 'https://scholarships.gov.in', status: 'ACTIVE' },
    { name: 'Pragati Scholarship Scheme for Girl Students', eligibility: 'Girl students admitted to 1st year or 2nd year lateral entry. Family income < 8 LPA.', lastDate: new Date('2026-11-30'), link: 'https://www.aicte-india.org', status: 'ACTIVE' },
    { name: 'State Government Merit Scholarship', eligibility: 'Top 3 rankers in each branch of the previous academic year. No income limit.', lastDate: new Date('2026-08-31'), link: 'https://jnanabhumi.ap.gov.in', status: 'ACTIVE' },
  ];

  for (const s of scholarshipsData) {
    await prisma.scholarship.create({ data: s });
  }
  console.log('Scholarships seeded.');

  // 11. Announcements
  console.log('Seeding announcements...');
  const announcementsData = [
    { title: 'SBTET Diploma Examinations Fee Notification', content: 'The SBTET Board examination fee portal is open for Semesters 1, 3, and 5. The last date to submit the exam application online without late fee is July 10, 2026. Hall tickets will be issued on July 15, 2026.', category: 'Examination', priority: 'HIGH', authorId: adminUser.id },
    { title: 'Diploma 2nd and 4th Sem Results Published', content: 'SBTET has released the regular and supplementary examination results for the April/May 2026 session. Students can check their results in the results tab. Revaluation applications can be filed until June 30, 2026.', category: 'Results', priority: 'HIGH', authorId: adminUser.id },
    { title: 'Workshop on Cyber Security by APSSDC', content: 'Department of Computer Engineering is organizing a 3-day workshop on Cyber Security & Ethical Hacking in association with APSSDC from June 25 to June 27, 2026. Interested students of CSE/ECE can register by June 22.', category: 'Workshops', priority: 'MEDIUM', authorId: adminUser.id },
    { title: 'Holiday Announcement - Bakrid', content: 'All classes and college offices will remain closed on June 18, 2026, in observance of Bakrid. Regular classes will resume on June 19, 2026.', category: 'Holidays', priority: 'LOW', authorId: adminUser.id },
    { title: 'National Seminar on Renewable Energy Sources', content: 'Department of Electrical Engineering is conducting a national seminar on Solar and Wind Energy Integration in modern power systems. Guest speaker Dr. P. Raghavan from IIT Madras will deliver the keynote address.', category: 'Seminars', priority: 'MEDIUM', authorId: adminUser.id },
  ];

  for (const a of announcementsData) {
    await prisma.announcement.create({ data: a });
  }
  console.log('Announcements seeded.');

  // 12. Resources
  console.log('Seeding educational resources...');
  const educationalResources = [
    // CSE Resources
    { name: 'C Programming Lecture Notes PDF', type: 'PDF', url: 'https://www.tutorialspoint.com/cprogramming/cprogramming_tutorial.pdf', subCode: 'CS101' },
    { name: 'Data Structures Complete Course', type: 'Video', url: 'https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_yfRphLH_O3Klga9Szc', subCode: 'CS102' },
    { name: 'C++ Reference Docs', type: 'Website', url: 'https://en.cppreference.com/w/', subCode: 'CS201' },
    { name: 'Java Programming Reference Book', type: 'Book', url: 'https://docs.oracle.com/javase/tutorial/', subCode: 'CS202' },
    { name: 'Python for Beginners Playlists', type: 'Video', url: 'https://www.youtube.com/playlist?list=PL-osiE80TeTskrapUr9KYw5VJHyIpFC47', subCode: 'CS301' },
    { name: 'Database Management Systems Tutorial', type: 'Website', url: 'https://www.geeksforgeeks.org/dbms/', subCode: 'CS302' },
    { name: 'Operating Systems Notes', type: 'PDF', url: 'https://www.tutorialspoint.com/operating_system/operating_system_tutorial.pdf', subCode: 'CS303' },
    { name: 'Computer Networks - Cisco Academy Notes', type: 'Website', url: 'https://www.netacad.com/', subCode: 'CS304' },
    { name: 'Web Technologies MDN Docs', type: 'Website', url: 'https://developer.mozilla.org', subCode: 'CS305' },
    { name: 'Software Engineering Best Practices', type: 'Book', url: 'https://nptel.ac.in/courses/106105182', subCode: 'CS306' },

    // ECE Resources
    { name: 'EDC Lecture Notes by NPTEL', type: 'PDF', url: 'https://nptel.ac.in/courses/108101091', subCode: 'EC101' },
    { name: 'Digital Electronics Tutorial', type: 'Website', url: 'https://www.electronics-tutorials.ws/combination/comb_1.html', subCode: 'EC102' },

    // EEE Resources
    { name: 'Electrical Machines Video Lectures', type: 'Video', url: 'https://www.youtube.com/playlist?list=PLbRMhDVUMngcf7A_T9N7T-yX-FwVv7hD3', subCode: 'EE102' },

    // Civil Resources
    { name: 'Surveying Complete Guide PDF', type: 'PDF', url: 'https://www.surveying.org/notes.pdf', subCode: 'CE102' },

    // Mech Resources
    { name: 'Thermodynamics Reference Book', type: 'Book', url: 'https://nptel.ac.in/courses/112105123', subCode: 'ME102' },
  ];

  for (const res of educationalResources) {
    const sub = dbSubjects.find((s) => s.code === res.subCode);
    if (sub) {
      await prisma.resource.create({
        data: {
          name: res.name,
          type: res.type,
          url: res.url,
          subjectId: sub.id,
        },
      });
    }
  }
  console.log('Educational resources seeded.');

  // 13. Timetables (Generate some initial records for CSE Sem 1, 3, 5 to make it fully populated)
  console.log('Generating sample timetables...');
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const rooms = dbClassrooms.filter((r) => !r.roomName.includes('Lab'));
  
  // Let's seed for CSE Sem 5
  const cseSem5Subs = dbSubjects.filter((s) => s.branch === 'CSE' && s.semester === 5);
  const cseTeachers = teachers.filter((t) => t.branch === 'CSE');

  if (cseSem5Subs.length >= 2 && cseTeachers.length >= 2 && rooms.length >= 1) {
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      // Period 1
      await prisma.timetable.create({
        data: {
          dayOfWeek: day,
          periodNumber: 1,
          subjectId: cseSem5Subs[0].id,
          teacherId: cseTeachers[0].id,
          classroomId: rooms[0].id,
          semester: 5,
          branch: 'CSE',
        },
      });
      // Period 2
      await prisma.timetable.create({
        data: {
          dayOfWeek: day,
          periodNumber: 2,
          subjectId: cseSem5Subs[1].id,
          teacherId: cseTeachers[1].id,
          classroomId: rooms[0].id,
          semester: 5,
          branch: 'CSE',
        },
      });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
