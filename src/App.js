// import React, { useState } from 'react';
// import Auth from './Auth';           
// import Dashboard from './pages/Dashboard'; 
// import ParentPortal from './pages/ParentPortal'; // 1. Import the new Parent Portal

// const App = () => {
//   const [isDarkMode, setIsDarkMode] = useState(true);
//   // Change isLoggedIn to null (logged out), 'admin', or 'parent'
//   const [userRole, setUserRole] = useState(null); 
//   const [page, setPage] = useState('login'); 
//   const [role, setRole] = useState('Administrator'); // Used for the Auth toggle

//   // Updated login handler to accept the role from Auth.js
//   const handleLogin = (selectedRole) => {
//     // Convert 'Administrator' string to 'admin' and others to 'parent'
//     const normalizedRole = selectedRole === 'Administrator' ? 'admin' : 'parent';
//     setUserRole(normalizedRole);
//   };

//   const handleLogout = () => {
//     setUserRole(null);
//   };

//   return (
//     <>
//       <style>{`
//         .theme-switcher {
//           position: fixed; top: 20px; right: 20px; z-index: 1050;
//           background: ${isDarkMode ? '#1e293b' : '#ffffff'}; 
//           border: 1px solid ${isDarkMode ? '#334155' : '#e2e8f0'};
//           color: ${isDarkMode ? '#fbbf24' : '#1e293b'}; 
//           padding: 10px; border-radius: 50%;
//           cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
//           display: flex; align-items: center; justify-content: center;
//           transition: all 0.3s ease;
//         }
//         .theme-switcher:hover { transform: scale(1.1); }
//       `}</style>
      
//       <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
//       <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />

//       <button className="theme-switcher" onClick={() => setIsDarkMode(!isDarkMode)}>
//         <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}></i>
//       </button>

//       {/* MULTI-ROLE SWITCH LOGIC */}
//       {userRole === 'admin' ? (
//         // Render Admin Dashboard
//         <Dashboard onLogout={handleLogout} isDarkMode={isDarkMode} />
//       ) : userRole === 'parent' ? (
//         // Render Parent Portal
//         <ParentPortal onLogout={handleLogout} isDarkMode={isDarkMode} />
//       ) : (
//         // Show Login/Auth Screen
//         <Auth 
//           onLogin={() => handleLogin(role)} 
//           isDarkMode={isDarkMode}
//           page={page}
//           setPage={setPage}
//           role={role}
//           setRole={setRole}
//         />
//       )}
//     </>
//   );
// };

// export default App;




import React, { useState } from 'react';
import Auth from './Auth';           
import Dashboard from './pages/Dashboard'; 
import ParentPortal from './pages/ParentPortal';

const App = () => {
  // null = not logged in, 'admin' = Administrator, 'parent' = Parent
  const [userRole, setUserRole] = useState(null); 

  // This function is passed as a prop to Auth.js
  const handleLogin = (selectedRole) => {
    // Normalize the role string to match your routing logic
    const normalizedRole = selectedRole.toLowerCase() === 'administrator' ? 'admin' : 'parent';
    setUserRole(normalizedRole);
  };

  const handleLogout = () => {
    setUserRole(null);
  };

  return (
    <>
      {userRole === 'admin' ? (
        <Dashboard onLogout={handleLogout} />
      ) : userRole === 'parent' ? (
        <ParentPortal onLogout={handleLogout} />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;