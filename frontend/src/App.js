// // 



// import React, { useState } from 'react';
// import Auth from './Auth';
// import Dashboard from './pages/Dashboard';
// import ParentPortal from './pages/ParentPortal';
// import Register from './pages/Register'; // ✅ IMPORTANT

// const App = () => {
//   const [userRole, setUserRole] = useState(null);
//   const [page, setPage] = useState('login'); // ✅ NEW

//   const handleLogin = (selectedRole) => {
//     const normalizedRole =
//       selectedRole.toLowerCase() === 'administrator' ? 'admin' : 'parent';
//     setUserRole(normalizedRole);
//   };

//   const handleLogout = () => {
//     setUserRole(null);
//     setPage('login'); // reset page
//   };

//   return (
//     <>
//       {userRole === 'admin' ? (
//         <Dashboard onLogout={handleLogout} />
//       ) : userRole === 'parent' ? (
//         <ParentPortal onLogout={handleLogout} />
//       ) : page === 'register' ? (
//         <Register setPage={setPage} />   // ✅ SHOW REGISTER
//       ) : (
//         <Auth onLogin={handleLogin} setPage={setPage} /> // ✅ PASS setPage
//       )}
//     </>
//   );
// };

// export default App;


import React, { useState } from 'react';
import Auth from './Auth';
import Dashboard from './pages/Dashboard';
import ParentPortal from './pages/ParentPortal';
import Register from './pages/Register';
// Ensure your CSS is imported here
import './Login.css'; 

const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [page, setPage] = useState('login');
  
  // --- THEME STATE ---
  // Default to 'dark'. You can also check local storage here.
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleLogin = (selectedRole) => {
    const normalizedRole =
      selectedRole.toLowerCase() === 'administrator' ? 'admin' : 'parent';
    setUserRole(normalizedRole);
  };

  const handleLogout = () => {
    setUserRole(null);
    setPage('login'); // reset page
  };

  return (
    // The data-theme attribute here triggers the CSS variables in your Login.css
    <div data-theme={theme} className="app-container">
      
      {/* Floating Theme Toggle Button */}
      <button 
        className="theme-switch-btn" 
        onClick={toggleTheme}
        style={{ cursor: 'pointer' }}
      >
        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {userRole === 'admin' ? (
        <Dashboard onLogout={handleLogout} />
      ) : userRole === 'parent' ? (
        <ParentPortal onLogout={handleLogout} />
      ) : page === 'register' ? (
        <Register setPage={setPage} />
      ) : (
        <Auth onLogin={handleLogin} setPage={setPage} />
      )}
    </div>
  );
};

export default App;
