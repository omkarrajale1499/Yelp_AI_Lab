import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';

const Navbar = () => {
  const { user, token, isAuthenticated: authState } = useSelector((state) => state.auth);
  const isAuthenticated = authState || !!user || !!token; 
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [isBizOpen, setIsBizOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('San Jose, CA'); 
  
  const bizDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null); 

  const role = user?.role || 'user';

  // Helper function to get First and Last initials
  const getInitials = (fullName) => {
    if (!fullName) return '';
    const nameArray = fullName.trim().split(' ');
    if (nameArray.length === 1) return nameArray[0].charAt(0).toUpperCase();
    return (nameArray[0].charAt(0) + nameArray[nameArray.length - 1].charAt(0)).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bizDropdownRef.current && !bizDropdownRef.current.contains(event.target)) {
        setIsBizOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileOpen(false);
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${searchQuery}&location=${locationQuery}`);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center gap-6">
          
          {/* LOGO */}
          <div className="flex-shrink-0 font-black text-3xl tracking-tighter">
            <Link to={role === 'owner' ? '/dashboard' : '/'} className="flex items-center gap-2">
              <span className="text-gray-900">yelp</span><span className="text-red-600">*</span><span className="text-red-600 text-xl tracking-normal">AI</span>
            </Link>
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 max-w-2xl hidden md:flex">
            <form onSubmit={handleSearch} className="w-full flex shadow-sm rounded-md overflow-hidden border border-gray-300 focus-within:ring-1 focus-within:ring-red-500 transition-shadow">
              <input 
                type="text" 
                placeholder="Name, cuisine, or keywords..." 
                className="w-full px-4 py-2 focus:outline-none text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="City or zip..." 
                className="border-l border-gray-300 px-4 py-2 bg-gray-50 text-gray-900 font-medium hidden lg:block w-32 md:w-48 focus:outline-none focus:bg-white transition-colors"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </form>
          </div>
          
          {/* NAVIGATION LINKS */}
          <div className="hidden md:flex items-center space-x-6">
            
            {!isAuthenticated ? (
              <>
                <div className="relative" ref={bizDropdownRef}>
                  <button onClick={() => setIsBizOpen(!isBizOpen)} className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1">
                    Yelp for Business
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isBizOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                      <Link 
                        to="/login?role=owner" 
                        onClick={() => setIsBizOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Log in to Business Account
                      </Link>
                      <Link 
                        to="/add-business" 
                        onClick={() => setIsBizOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Claim your business
                      </Link>
                    </div>
                  )}
                </div>

                <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">Write a Review</Link>
                
                <div className="flex items-center space-x-3 border-l border-gray-300 pl-6">
                  <Link to="/login" className="text-gray-700 hover:text-gray-900 font-bold px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">Log In</Link>
                  <Link to="/login" className="bg-red-600 text-white px-5 py-2.5 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm">Sign Up</Link>
                </div>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">Write a Review</Link>
                
                <div className="flex items-center gap-4 border-l border-gray-300 pl-6 relative" ref={profileDropdownRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold uppercase shadow-inner hover:bg-red-200 transition-colors focus:outline-none ring-2 ring-transparent focus:ring-red-500"
                  >
                    {user?.name ? getInitials(user.name) : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link to="/profile?tab=about" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        About Me
                      </Link>
                      <Link to="/profile?tab=favorites" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        Favourites
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 mt-1 border-t border-gray-100 pt-3">
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;