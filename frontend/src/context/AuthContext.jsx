// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { login as apiLogin, register as apiRegister, getMyProfile } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // user object {id, name, role, email}
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set axios default Authorization header whenever token changes
  useEffect(() => {
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete axios.defaults.headers.common["Authorization"];
  }, [token]);

  // Load user profile on mount if token exists
  useEffect(() => {
  const loadUser = async () => {
    if (token) {
      try {
        const res = await getMyProfile();
        setUser(res.data);
      } catch (err) {
        console.error("Token expired or invalid:", err);
        handleLogout();
      } finally {
        setLoading(false); // ✅ run only after profile attempt finishes
      }
    } else {
      setLoading(false); // ✅ only when no token
    }
  };
  loadUser();
}, [token]);


  // 🔑 Login
  const handleLogin = async (credentials) => {
    try {
      const res = await apiLogin(credentials);
      const { token } = res.data;
      
      localStorage.setItem("token", res.data.token);
      setToken(token);

      // Fetch full user profile
      const profileRes = await getMyProfile();
      const userData = profileRes.data;
      
      setUser(userData);

      // Return user data for immediate use in login form
      return { success: true, user: userData };
    } catch (err) {
      console.error("Login failed:", err);
      const errorMsg = err.response?.data?.message || "Login failed";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 📝 Register
  const handleRegister = async (userData) => {
    try {
      await apiRegister(userData);
      return true;
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || "Registration failed");
      return false;
    }
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
        register: handleRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
