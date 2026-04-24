import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', restaurantLocation: '' });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Check the URL for ?role=owner
  const searchParams = new URLSearchParams(location.search);
  const isOwner = searchParams.get('role') === 'owner';

  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    const endpoint = isLogin ? '/api/users/login' : '/api/users/signup';

    try {
      const response = await fetch(`http://localhost:8001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isLogin
            ? { email: formData.email, password: formData.password }
            // If signing up as an owner, attach the role to the payload!
            : { ...formData, role: isOwner ? 'owner' : 'user' }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isLogin) {
        dispatch(loginSuccess({
          token: data.access_token,
          user: data.user 
        }));
        
        // Smart Redirect: Owners go to dashboard, regular users go to explore
        if (data.user.role === 'owner') {
          navigate('/dashboard');
        } else {
          navigate('/'); 
        }
        
      } else {
        alert("Signup successful! Please log in.");
        setIsLogin(true);
        dispatch(loginFailure(null));
      }

    } catch (err) {
      dispatch(loginFailure(err.message));
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        
        <div className="text-center mb-8">
          {/* Dynamic Owner Branding Header */}
          {isOwner && (
            <div className="flex justify-center items-center gap-2 mb-4 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <span className="text-gray-900 font-black tracking-tight text-xl">Yelp for Business</span>
            </div>
          )}

          <h2 className="text-3xl font-extrabold text-gray-900">
            {isOwner 
              ? (isLogin ? 'Welcome back' : 'Create an account') 
              : (isLogin ? 'Log in to YelpAI' : 'Sign up for YelpAI')}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'New to YelpAI? ' : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-red-600 hover:text-red-500 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required={!isLogin}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-shadow"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              name="email"
              required
              className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-shadow"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-shadow"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Extra field exclusively for Owner Sign Up */}
          {!isLogin && isOwner && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Restaurant Location</label>
              <input
                type="text"
                name="restaurantLocation"
                placeholder="e.g., San Jose, CA"
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-shadow"
                value={formData.restaurantLocation}
                onChange={handleChange}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${
              isOwner 
                ? 'bg-gray-900 hover:bg-black focus:ring-gray-900' 
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            {loading ? 'Processing...' : (isLogin ? (isOwner ? 'Sign In' : 'Log In') : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginSignup;