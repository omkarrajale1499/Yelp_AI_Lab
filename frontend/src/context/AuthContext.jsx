import React, { createContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'user' or 'owner'
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on page load
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role') || 'user';
      
      if (token) {
        try {
          if (storedRole === 'owner') {
            const res = await axiosClient.get('/owners/dashboard');
            // FIXED: Fallback to res.data if owner_profile doesn't exist
            setUser(res.data.owner_profile || res.data);
            setRole('owner');
          } else {
            const res = await axiosClient.get('/users/me');
            setUser(res.data);
            setRole('user');
          }
        } catch (error) {
          console.error("Token invalid or expired", error);
          logout(); // Clear bad tokens
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password, isOwner = false) => {
    const endpoint = isOwner ? '/owners/login' : '/auth/login';
    const formData = new URLSearchParams();
    formData.append('username', email); 
    formData.append('password', password);
    
    const res = await axiosClient.post(endpoint, formData);
    localStorage.setItem('token', res.data.access_token);
    localStorage.setItem('role', isOwner ? 'owner' : 'user');
    
    // Fetch and set user profile based on role
    if (isOwner) {
      const userRes = await axiosClient.get('/owners/dashboard');
      // FIXED: Fallback to userRes.data if owner_profile doesn't exist
      setUser(userRes.data.owner_profile || userRes.data);
      setRole('owner');
    } else {
      const userRes = await axiosClient.get('/users/me');
      setUser(userRes.data);
      setRole('user');
    }
  };

  const signup = async (name, email, password, isOwner = false, location = null) => {
    const endpoint = isOwner ? '/owners/signup' : '/auth/signup';
    
    // Dynamically build the payload based on the user's role
    const payload = isOwner 
      ? { name, email, password, restaurant_location: location } 
      : { name, email, password };

    await axiosClient.post(endpoint, payload);
    // Automatically log them in after successful signup
    await login(email, password, isOwner);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};