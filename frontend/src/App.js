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


import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import Dashboard from './pages/Dashboard';
import ParentPortal from './pages/ParentPortal';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import LandingPage from './LandingPage';
// Ensure your CSS is imported here
import './Login.css'; 
import './Responsive.css'; 
import { Sun, MoonFill } from 'react-bootstrap-icons';
const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [page, setPage] = useState('landing');
  const [registerRole, setRegisterRole] = useState('parent');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // --- THEME STATE ---
  // Default to 'dark'. You can also check local storage here.
  const [theme, setTheme] = useState('dark');

  // --- RESTORE SESSION ---
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const user = await response.json();
          setUserRole(user.role === 'admin' ? 'admin' : 'parent');
        } else {
          // Token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUserRole(null);
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleLogin = (selectedRole) => {
    const normalizedRole =
      selectedRole.toLowerCase() === 'administrator' ? 'admin' : 'parent';
    setUserRole(normalizedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserRole(null);
    setPage('login'); // reset page
  };

  if (isAuthLoading) {
    return (
      <div data-theme={theme} className="app-container d-flex justify-content-center align-items-center vh-100" style={{backgroundColor: '#0f172a'}}>
        <div className="spinner-border" role="status" style={{color: '#00d9cc', width: '3rem', height: '3rem'}}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    // The data-theme attribute here triggers the CSS variables in your Login.css
    <div data-theme={theme} className="app-container">
      
      {page === 'landing' ? (
        <LandingPage onStart={() => setPage('login')} />
      ) : userRole === 'admin' ? (
        <Dashboard onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      ) : userRole === 'parent' ? (
        <ParentPortal onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      ) : page === 'register' ? (
        <Register setPage={setPage} role={registerRole} onLogin={handleLogin} />
      ) : page === 'forgot-password' ? (
        <ForgotPassword setPage={setPage} />
      ) : (
        <Auth onLogin={handleLogin} setPage={setPage} setRegisterRole={setRegisterRole} theme={theme} toggleTheme={toggleTheme} />
      )}
    </div>
  );
};

export default App;
