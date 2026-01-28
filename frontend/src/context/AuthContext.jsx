import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the Context (The "Global State" bucket)
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. Check Storage on Load (Local OR Session)
  useEffect(() => {
    const storedUser = localStorage.getItem('imssa_user') || sessionStorage.getItem('imssa_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 3. Login Function (With Remember Me support)
  const login = (userData, token, remember = false) => {
    setUser(userData);

    if (remember) {
      localStorage.setItem('imssa_user', JSON.stringify(userData));
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('imssa_user', JSON.stringify(userData));
      sessionStorage.setItem('token', token);
    }
  };

  // 4. Logout Function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('imssa_user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('imssa_user');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 5. Custom Hook (Shortcuts to use this context elsewhere)
export const useAuth = () => useContext(AuthContext);