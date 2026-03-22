// 



import React, { useState } from 'react';
import Auth from './Auth';
import Dashboard from './pages/Dashboard';
import ParentPortal from './pages/ParentPortal';
import Register from './pages/Register'; // ✅ IMPORTANT

const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [page, setPage] = useState('login'); // ✅ NEW

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
    <>
      {userRole === 'admin' ? (
        <Dashboard onLogout={handleLogout} />
      ) : userRole === 'parent' ? (
        <ParentPortal onLogout={handleLogout} />
      ) : page === 'register' ? (
        <Register setPage={setPage} />   // ✅ SHOW REGISTER
      ) : (
        <Auth onLogin={handleLogin} setPage={setPage} /> // ✅ PASS setPage
      )}
    </>
  );
};

export default App;