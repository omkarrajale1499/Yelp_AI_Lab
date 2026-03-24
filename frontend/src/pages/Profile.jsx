import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import RestaurantCard from '../components/RestaurantCard';

const Profile = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'about';

  const [profileData, setProfileData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [settingsForm, setSettingsForm] = useState({});
  const [prefsForm, setPrefsForm] = useState({
    cuisine: '', price: '', radius: '', dietary: '', ambiance: '', sort: ''
  });

  // NEW: Ref for hidden file input
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [userRes, favRes, prefRes, histRes] = await Promise.all([
          axiosClient.get('/users/me'),
          axiosClient.get('/favorites/').catch(() => ({ data: [] })),
          axiosClient.get('/users/preferences').catch(() => ({ data: { preferences: {} } })),
          axiosClient.get('/reviews/me').catch(() => ({ data: [] }))
        ]);
        
        setProfileData(userRes.data);
        setSettingsForm(userRes.data);
        setFavorites(favRes.data);
        setHistory(histRes.data);
        
        if (prefRes.data.preferences) {
          setPrefsForm(prev => ({ ...prev, ...prefRes.data.preferences }));
        }
      } catch (error) {
        console.error("Error fetching profile data", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchAllData();
  }, [user]);

  const handleSettingsChange = (e) => {
    setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });
  };

  const handlePrefsChange = (e) => {
    setPrefsForm({ ...prefsForm, [e.target.name]: e.target.value });
  };

  const submitSettings = async (e) => {
    e.preventDefault();
    try {
      const { id, email, hashed_password, preferences, profile_picture, ...updatePayload } = settingsForm;
      const res = await axiosClient.put('/users/me', updatePayload);
      setProfileData(res.data);
      setMsg({ type: 'success', text: 'Account settings updated successfully!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (error) {
      setMsg({ type: 'error', text: 'Failed to update settings.' });
    }
  };

  const submitPrefs = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put('/users/preferences', { preferences: prefsForm });
      setMsg({ type: 'success', text: 'AI Preferences updated successfully!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (error) {
      setMsg({ type: 'error', text: 'Failed to update preferences.' });
    }
  };

  // --- NEW: Profile Picture Upload Logic ---
  const handleAddPhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMsg({ type: 'info', text: 'Uploading photo...' });
      
      const formData = new FormData();
      formData.append('file', e.target.files[0]);

      try {
        const response = await axiosClient.post('/users/me/photo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Update local state with the new user object containing the image URL
        setProfileData(response.data);
        setMsg({ type: 'success', text: 'Profile photo updated successfully!' });
        setTimeout(() => setMsg({ type: '', text: '' }), 4000);
      } catch (error) {
        setMsg({ type: 'error', text: error.response?.data?.detail || 'Failed to upload photo.' });
      } finally {
        e.target.value = null; // Clear input for future selections
      }
    }
  };
  // ----------------------------------------

  // Function to build full image URL from backend static path
  const getImageUrl = (path) => {
    if (!path) return null;
    return `http://localhost:8000${path}`;
  };

  if (authLoading || loading) return <div className="p-10 text-center text-gray-500 font-medium">Loading profile...</div>;

  // --- Render Helpers ---
  const renderAbout = () => (
    <div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">More about me</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:divide-x divide-gray-200">
        <div className="pr-6 mb-4 sm:mb-0">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Location</h3>
          <p className="text-gray-600">{profileData.city && profileData.state ? `${profileData.city}, ${profileData.state}` : 'Not set'}</p>
        </div>
        <div className="px-6 mb-4 sm:mb-0">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Yelping since</h3>
          <p className="text-gray-600">March 2026</p>
        </div>
        <div className="pl-6">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Languages</h3>
          <p className="text-gray-600">{profileData.languages || 'Not set'}</p>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-3">About {profileData.name.split(' ')[0]}</h3>
        <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-xl border border-gray-100">
          {profileData.about_me || "This user hasn't added an about me section yet."}
        </p>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Account Settings</h2>
      <form onSubmit={submitSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input type="text" name="name" value={settingsForm.name || ''} onChange={handleSettingsChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email (Read Only)</label>
            <input type="email" value={profileData.email} disabled className="w-full bg-gray-100 border border-gray-300 text-gray-500 text-sm rounded-md p-2.5 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
            <input type="text" name="phone_number" value={settingsForm.phone_number || ''} onChange={handleSettingsChange} placeholder="(555) 555-5555" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
            <select name="gender" value={settingsForm.gender || ''} onChange={handleSettingsChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
            <input type="text" name="city" value={settingsForm.city || ''} onChange={handleSettingsChange} placeholder="e.g., San Jose" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">State (Abbreviated)</label>
            <input type="text" name="state" value={settingsForm.state || ''} onChange={handleSettingsChange} maxLength="2" placeholder="CA" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500 uppercase" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Country</label>
            <select name="country" value={settingsForm.country || ''} onChange={handleSettingsChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500">
              <option value="">Select Country...</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="India">India</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Languages spoken</label>
            <input type="text" name="languages" value={settingsForm.languages || ''} onChange={handleSettingsChange} placeholder="English, Spanish, etc." className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">About Me</label>
          <textarea name="about_me" value={settingsForm.about_me || ''} onChange={handleSettingsChange} rows="4" placeholder="Tell us a little about yourself..." className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500 resize-none"></textarea>
        </div>
        <button type="submit" className="bg-red-600 text-white px-6 py-2.5 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm">Save Settings</button>
      </form>
    </div>
  );

  const renderPreferences = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🧠</span>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">AI Assistant Preferences</h2>
          <p className="text-sm text-gray-500">Tune the LangChain logic to your personal tastes.</p>
        </div>
      </div>
      <form onSubmit={submitPrefs} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Favorite Cuisines</label>
            <input type="text" name="cuisine" value={prefsForm.cuisine} onChange={handlePrefsChange} placeholder="Italian, Mexican, Sushi..." className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Price Range</label>
            <select name="price" value={prefsForm.price} onChange={handlePrefsChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500">
              <option value="">Any</option>
              <option value="$">$ - Cheap Eats</option>
              <option value="$$">$$ - Moderate</option>
              <option value="$$$">$$$ - Fine Dining</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Dietary Restrictions</label>
            <input type="text" name="dietary" value={prefsForm.dietary} onChange={handlePrefsChange} placeholder="Vegan, Halal, Gluten-free..." className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Ambiance</label>
            <input type="text" name="ambiance" value={prefsForm.ambiance} onChange={handlePrefsChange} placeholder="Casual, Romantic, Family-friendly..." className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Search Radius</label>
            <select name="radius" value={prefsForm.radius} onChange={handlePrefsChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500">
              <option value="">Any distance</option>
              <option value="Walking (1 mi)">Walking (1 mi)</option>
              <option value="Biking (5 mi)">Biking (5 mi)</option>
              <option value="Driving (10+ mi)">Driving (10+ mi)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Sort Preference</label>
            <select name="sort" value={prefsForm.sort} onChange={handlePrefsChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500">
              <option value="">Recommended (Default)</option>
              <option value="Rating">Highest Rating</option>
              <option value="Distance">Closest Distance</option>
              <option value="Price">Lowest Price</option>
            </select>
          </div>
        </div>
        <button type="submit" className="bg-gray-900 text-white px-6 py-2.5 rounded-md font-bold hover:bg-black transition-colors shadow-sm">Update AI Brain</button>
      </form>
    </div>
  );

  const renderFavorites = () => (
    <div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">My Favourites</h2>
      {favorites.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-medium text-lg">No favourites yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map(restaurant => (
            <RestaurantCard 
              key={restaurant.id || restaurant.restaurant_id} 
              restaurant={restaurant.restaurant || restaurant} 
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Activity History</h2>
      {history.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-medium text-lg">No history found.</p>
          <p className="text-gray-400 text-sm mt-2">You haven't posted any reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map(rev => (
            <div key={rev.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded uppercase tracking-wider">Review Posted</span>
                  <p className="text-sm text-gray-900 mt-2 font-bold text-lg">{rev.restaurant_name}</p>
                </div>
                <span className="text-sm text-gray-400 font-medium">
                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                </span>
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className={`w-5 h-5 ${star <= rev.rating ? 'text-red-500 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              <p className="text-gray-800 italic leading-relaxed">"{rev.comment}"</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                 <Link to={`/restaurant/${rev.restaurant_id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                   View Listing
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                 </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- Main Layout ---
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {msg.text && (
        <div className={`mb-6 p-4 rounded-md text-sm font-bold ${msg.type === 'success' ? 'bg-green-100 text-green-800' : msg.type === 'info' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
          
          {/* Profile Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col items-center mb-6">
            
            {/* UPDATED: Displays actual photo or fallback initial */}
            <div className="w-32 h-32 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-5xl font-black mb-4 shadow-inner overflow-hidden border-2 border-white ring-2 ring-gray-100">
              {profileData.profile_picture ? (
                <img src={getImageUrl(profileData.profile_picture)} alt={profileData.name} className="w-full h-full object-cover" />
              ) : (
                profileData.name.charAt(0).toUpperCase()
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 text-center">{profileData.name}</h1>
            <p className="text-gray-500 text-sm mt-1 text-center">
              {profileData.city && profileData.state ? `${profileData.city}, ${profileData.state}` : 'Location unknown'}
            </p>
            
            <div className="flex justify-center gap-4 mt-6 w-full border-t border-gray-100 pt-4">
              <button onClick={() => navigate('/profile?tab=settings')} className="flex flex-col items-center text-gray-500 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <span className="text-xs font-medium">Edit Profile</span>
              </button>
              
              {/* UPDATED: Hidden input and working Add Photo button */}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <button onClick={handleAddPhotoClick} className="flex flex-col items-center text-gray-500 hover:text-red-600 transition-colors cursor-pointer">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-xs font-medium">Change Photo</span>
              </button>
            </div>
          </div>

          {/* Navigation Sidebar */}
          <nav className="flex flex-col gap-1">
            <Link to="/profile?tab=about" className={`flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors ${activeTab === 'about' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Profile Overview
            </Link>
            <Link to="/profile?tab=settings" className={`flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors ${activeTab === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Account Settings
            </Link>
            
            <div className="border-b border-gray-200 my-2"></div>
            
            <Link to="/profile?tab=favorites" className={`flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors ${activeTab === 'favorites' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              Favourites
            </Link>

            <Link to="/profile?tab=history" className={`flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors ${activeTab === 'history' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              User History
            </Link>
            
            <Link to="/profile?tab=preferences" className={`flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors ${activeTab === 'preferences' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              AI Preferences
            </Link>
          </nav>

        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {activeTab === 'about' && renderAbout()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'preferences' && renderPreferences()}
          {activeTab === 'favorites' && renderFavorites()}
          {activeTab === 'history' && renderHistory()}
        </div>

      </div>
    </div>
  );
};

export default Profile;