import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isBizOpen, setIsBizOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // <-- New state for Profile Dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('San Jose, CA'); 
  
  const bizDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null); // <-- New ref for Profile Dropdown

  // Close dropdowns when clicking outside
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
    logout();
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
          
          <div className="flex-shrink-0 font-black text-3xl tracking-tighter">
            <Link to={role === 'owner' ? '/dashboard' : '/'} className="flex items-center gap-2">
              yelp<span className="text-red-600">*</span><span className="text-red-600 text-xl tracking-normal">AI</span>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl hidden md:flex">
            <form onSubmit={handleSearch} className="w-full flex shadow-sm rounded-md overflow-hidden border border-gray-300 focus-within:ring-1 focus-within:ring-red-500 transition-shadow">
              <input 
                type="text" 
                placeholder="Name, cuisine, or keywords (e.g. quiet, wifi)..." 
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
          
          <div className="hidden md:flex items-center space-x-6">
            {!user ? (
              <>
                <div className="relative" ref={bizDropdownRef}>
                  <button 
                    onClick={() => setIsBizOpen(!isBizOpen)}
                    className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1"
                  >
                    Yelp for Business
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  
                  {isBizOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-100 py-2 z-50">
                      <Link to="/login?role=owner" onClick={() => setIsBizOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Add a Business
                      </Link>
                      <Link to="/login?role=owner" onClick={() => setIsBizOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Claim your business for free
                      </Link>
                      <Link to="/login?role=owner" onClick={() => setIsBizOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 border-t border-gray-100 mt-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Log in to Business Account
                      </Link>
                    </div>
                  )}
                </div>

                <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">Write a Review</Link>
                
                <div className="flex items-center space-x-3 border-l border-gray-300 pl-6">
                  <Link to="/login" className="text-gray-700 hover:text-gray-900 font-bold px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                    Log In
                  </Link>
                  <Link to="/login" className="bg-red-600 text-white px-5 py-2.5 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm">
                    Sign Up
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">Write a Review</Link>
                
                <div className="flex items-center gap-4 border-l border-gray-300 pl-6 relative" ref={profileDropdownRef}>
                  
                  {/* Clickable Avatar */}
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold uppercase shadow-inner hover:bg-gray-300 transition-colors focus:outline-none"
                  >
                    {user.name.charAt(0)}
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
                      <Link to="/profile?tab=about" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        About Me
                      </Link>
                      <Link to="/profile?tab=favorites" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        Favourites
                      </Link>
                      <Link to="/profile?tab=settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Account Settings
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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