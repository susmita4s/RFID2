# 🏫 RFID School Management System

A full-stack school management system powered by RFID technology. Manage student attendance, bus boarding, library access, and fee payments — all triggered by RFID card scans.

---

## 📁 Project Structure

```
RFID2/
├── backend/                  # Node.js + Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (SQLite / MySQL)
│   │   └── dev.db            # SQLite development database
│   ├── routes/               # API route handlers
│   │   ├── auth.js           # Login, register, JWT
│   │   ├── students.js       # Student CRUD + RFID lookup
│   │   ├── attendance.js     # Mark & fetch attendance
│   │   ├── bus.js            # Bus boarding logs
│   │   ├── library.js        # Borrow / return books
│   │   └── payments.js       # Fee management
│   ├── server.js             # Express app entry point
│   ├── seed.js               # Populate DB with demo data
│   ├── check.js              # DB health check utility
│   ├── make-admin.js         # Promote user to admin via CLI
│   ├── .env                  # Environment variables (not committed)
│   └── package.json
│
└── frontend/                 # React.js web interface
    ├── public/               # Static HTML, icons, manifest
    ├── src/
    │   ├── pages/            # All page components
    │   ├── App.js            # Routes & layout
    │   ├── Auth.js           # Auth context & guards
    │   └── Login.js          # Login UI
    └── package.json
```

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npx prisma db push       # Create database tables
node seed.js             # Populate with demo data
npm run dev              # Start server on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm start                # Start React app on port 3000
```

### Demo Credentials
| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@school.com       | admin123    |
| Teacher | teacher@school.com     | teacher123  |

---

## 🔑 Key Features

| Module        | Description                                        |
|---------------|----------------------------------------------------|
| **Auth**      | JWT-based login, role-based access (admin/user)    |
| **Students**  | Add, edit, deactivate students; RFID tag linking   |
| **Attendance**| RFID scan or manual entry; daily summary           |
| **Bus**       | Board/alight logging via RFID; route tracking      |
| **Library**   | Borrow/return books; auto fine calculation         |
| **Payments**  | Fee creation, collection tracking, overdue alerts  |
| **Parent Portal** | Parents view their child's records             |

---

## 🛠️ Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 19, Bootstrap 5             |
| Backend  | Node.js, Express 4                |
| ORM      | Prisma 5                          |
| Database | SQLite (dev) / MySQL (production) |
| Auth     | JWT (jsonwebtoken) + bcryptjs     |

---

## 📜 Useful Commands

```bash
# Backend utilities
node check.js                        # Check all DB records
node make-admin.js john@school.com   # Promote user to admin
npx prisma studio                    # Visual DB browser
npx prisma db push                   # Sync schema to DB
```
