# 🎓 CampusConnect — Government Diploma College ERP Portal

A production-ready, full-stack ERP system for Government Diploma Colleges in Andhra Pradesh. Built with React, Node.js, PostgreSQL, and Prisma.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router DOM v6 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Backend | Node.js + Express.js (ESM) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcryptjs |
| CSV Import | Multer + csv-parser |

---

## 🏗️ Project Structure

```
CC/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api/axios.js      # Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── ForcePasswordChange.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                  # Node/Express backend
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Database seed (100 students, 15 teachers)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── teacher.controller.js
│   │   │   ├── student.controller.js
│   │   │   └── timetable.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── routes/
│   │   │   └── api.routes.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ running locally, OR **Docker** + Docker Compose
- **npm** or **yarn**

---

## 🚀 Local Setup (Without Docker)

### 1. Configure the Database

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE campusconnect;
```

### 2. Configure Environment Variables

Edit `server/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/campusconnect?schema=public"
JWT_SECRET="supersecretcampusconnectjwttokenhashvalue12345"
```

### 3. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Run Database Migration + Generate Client

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Seed Sample Data

```bash
cd server
npm run prisma:seed
```

This creates:
- **1 Admin** — Username: `admin` | Password: `admin123`
- **15 Teachers** — Faculty IDs: `T101` to `T115` | Default password: Faculty ID (e.g., `T101`)
- **100 Students** — Reg numbers: `S2001` to `S2100` | Default password: Reg number (e.g., `S2001`)
- Sample attendance, results, subjects, classrooms, bus routes, scholarships, and announcements

### 6. Start the Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Docker Setup (Recommended)

```bash
# From the project root (CC/)
docker-compose up --build
```

The app will be available at [http://localhost:5000](http://localhost:5000).

> **Note:** After the first run, exec into the app container and run the database migration and seed:
> ```bash
> docker exec -it campusconnect-app sh
> npx prisma migrate deploy
> node prisma/seed.js
> ```

---

## 🔐 Default Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Teacher (example) | `T101` | `T101` (forced to change on first login) |
| Student (example) | `S2001` | `S2001` (forced to change on first login) |

---

## 📋 Features

### Admin Portal
- **Overview Dashboard** — Student/teacher counts, department-wise charts, attendance pie
- **Student Management** — Add, edit, delete, toggle active, reset password, bulk CSV import
- **Teacher Management** — Add, edit, delete, assign subjects per branch
- **Academic Config** — Department and subject registry (CRUD)
- **Smart Timetable Generator** — Auto-schedule with conflict detection (teacher, classroom, class period)
- **Utilities** — Announcements (with priority), APSRTC bus routes, scholarships, educational resources

### Teacher Portal
- **Roll Call Sheet** — Mark attendance by date and subject; view past records
- **Marks Entry** — Enter internal, assignment, and lab marks per student per subject
- **My Timetable** — View assigned period schedule for the week
- **Profile Settings** — Update contact info; change password

### Student Portal
- **Dashboard** — Attendance percentage gauge, upcoming scholarship deadlines, recent notices
- **Attendance Tracker** — Subject-wise breakdown with shortage alert (< 75%)
- **Academics & Marks** — Results breakdown table with performance chart
- **Weekly Timetable** — Full class schedule with teacher and classroom info
- **Resource Center** — Filterable PDF/video/website study materials per branch
- **APSRTC Routes** — Searchable/filterable bus timetable with stops
- **Profile Settings** — Update contact info and change password

---

## 🗂️ API Routes Summary

```
POST   /api/auth/login
GET    /api/auth/verify
POST   /api/auth/change-password

GET    /api/shared/announcements
GET    /api/shared/scholarships
GET    /api/shared/routes
GET    /api/shared/departments
GET    /api/shared/subjects
GET    /api/shared/timetable

GET    /api/admin/metrics
GET    /api/admin/students       POST  PUT  DELETE
POST   /api/admin/students/import
POST   /api/admin/teachers/assign-subjects
GET    /api/admin/teachers       POST  PUT  DELETE
POST   /api/admin/users/toggle-status
GET    /api/admin/classrooms     POST  DELETE
GET    /api/admin/announcements  POST  DELETE
GET    /api/admin/routes         POST  PUT  DELETE
GET    /api/admin/resources      POST  DELETE
POST   /api/admin/timetable
GET    /api/admin/timetable/validate
POST   /api/admin/timetable/generate

GET    /api/teacher/subjects
GET    /api/teacher/students
GET    /api/teacher/attendance   POST
GET    /api/teacher/marks        POST
GET    /api/teacher/timetable
PUT    /api/teacher/profile

GET    /api/student/dashboard
GET    /api/student/attendance
GET    /api/student/results
GET    /api/student/timetable
GET    /api/student/resources
PUT    /api/student/profile
```

---

## 📝 CSV Import Format for Bulk Student Import

Column headers (case-sensitive):
```
regNumber,name,branch,semester,email,mobile
S3001,Raju Naidu,CSE,3,raju@example.com,9876543210
```

---

## 🏛️ Departments Supported
- CSE (Computer Engineering)
- ECE (Electronics & Communication Engineering)
- EEE (Electrical & Electronics Engineering)
- Civil (Civil Engineering)
- Mechanical (Mechanical Engineering)
