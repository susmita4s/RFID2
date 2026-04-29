# RFID School Management System — Frontend

A React-based frontend for the RFID School Management System, providing dashboards and interfaces for:

- 🔐 Authentication (Login / Register)
- 📊 Admin Dashboard
- 🎓 Student Management
- 📋 Attendance Tracking
- 🚌 Bus Boarding Monitor
- 📚 Library Management
- 💰 Payments & Fees
- 👨‍👩‍👧 Parent Portal
- ⚙️ Settings

---

## Getting Started

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Start the development server
```bash
npm start
```
The app runs at **http://localhost:3000**

> Make sure the backend server is running at `http://localhost:5000` before starting the frontend.

---

## Project Structure

```
frontend/
├── public/          # Static assets (index.html, icons, manifest)
└── src/
    ├── App.js       # Main app with routing
    ├── Auth.js      # Auth context & protected routes
    ├── Login.js     # Login page
    ├── index.js     # React entry point
    └── pages/
        ├── Dashboard.js
        ├── Student.js
        ├── Attendance.js
        ├── BusBoarding.js
        ├── Library.js
        ├── Payments.js
        ├── ParentPortal.js
        ├── Settings.js
        ├── Register.js
        └── Logout.js
```

---

## Available Scripts

| Command         | Description                  |
|-----------------|------------------------------|
| `npm start`     | Start dev server (port 3000) |
| `npm run build` | Build for production         |
| `npm test`      | Run tests                    |
