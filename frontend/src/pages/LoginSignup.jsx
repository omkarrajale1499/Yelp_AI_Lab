import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // 1. ADDED: restaurant_location to initial state
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    restaurant_location: '' 
  });
  
  const [error, setError] = useState('');
  
  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const isOwner = queryParams.get('role') === 'owner';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(formData.email, formData.password, isOwner);
      } else {
        // 2. ADDED: Pass restaurant_location as the 5th parameter to your signup function
        await signup(formData.name, formData.email, formData.password, isOwner, formData.restaurant_location);
      }
      navigate(isOwner ? '/dashboard' : '/'); 
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 space-y-6">
        
        <div className="text-center">
          {isOwner && (
            <div className="mb-4 text-gray-900 font-black text-xl flex items-center justify-center gap-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Yelp for Business
            </div>
          )}
          
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? "New to YelpAI? " : "Already have an account? "}
            <button onClick={() => {setIsLogin(!isLogin); setError('');}} className="font-medium text-red-600 hover:text-red-500 transition-colors">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium border border-red-100">{error}</div>}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input name="name" type="text" required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" onChange={handleChange} />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <input name="email" type="email" required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input name="password" type="password" required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" onChange={handleChange} />
          </div>

          {/* 3. NEW: Conditionally render Restaurant Location ONLY for new Owners */}
          {!isLogin && isOwner && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Restaurant Location</label>
              <input name="restaurant_location" type="text" required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" onChange={handleChange} placeholder="e.g., San Jose, CA" />
            </div>
          )}

          <button type="submit" className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white transition-colors ${isOwner ? 'bg-gray-900 hover:bg-black' : 'bg-red-600 hover:bg-red-700'}`}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginSignup;