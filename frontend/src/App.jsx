import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import LoginSignup from './pages/LoginSignup';
import OwnerDashboard from './pages/OwnerDashboard';
import RestaurantDetail from './pages/RestaurantDetail';
import AIChat from './components/AIChat';
import AddRestaurant from './pages/AddRestaurant';

const App = () => {
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