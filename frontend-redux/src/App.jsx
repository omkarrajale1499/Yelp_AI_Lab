import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from './store/authSlice'; 

import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import LoginSignup from './pages/LoginSignup';
import OwnerDashboard from './pages/OwnerDashboard';
import RestaurantDetail from './pages/RestaurantDetail';
import AIChat from './components/AIChat';
import AddRestaurant from './pages/AddRestaurant';

const App = () => {
  const dispatch = useDispatch();

  // --- NEW: Global Boot-up Script ---
  useEffect(() => {
    const fetchUserOnLoad = async () => {
      const token = localStorage.getItem('token');
      
      // If there is a token in storage, fetch the user data immediately!
      if (token) {
        try {
          const response = await fetch('http://localhost:8001/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            // Restore the Redux state with the fresh user data
            dispatch(loginSuccess({ token, user: userData }));
          } else {
            // If the token is expired or invalid, clear everything out
            dispatch(logout());
          }
        } catch (error) {
          console.error("Failed to restore session on load:", error);
        }
      }
    };

    fetchUserOnLoad();
  }, [dispatch]);
  // ----------------------------------

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Explore />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<LoginSignup />} />
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/add-business" element={<AddRestaurant />} />
          </Routes>
        </main>

        <AIChat />
      </div>
    </Router>
  );
};

export default App;