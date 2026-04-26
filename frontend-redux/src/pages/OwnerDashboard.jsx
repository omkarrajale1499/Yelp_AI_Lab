import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

const OwnerDashboard = () => {
  // --- REDUX SWAP ---
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const role = user?.role || 'user';
  
  const [restaurants, setRestaurants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingRest, setEditingRest] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (authLoading) return;

    // THE FIX: If authenticated but 'user' is null, App.jsx is still fetching the profile. Wait!
    if (isAuthenticated && !user) return;

    if (!isAuthenticated || role !== 'owner') {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        
        const safeOwnerId = user?.id || user?._id;

        // 1. Fetch Owned Restaurants from Port 8002
        const resReq = await fetch(`http://localhost:8002/api/restaurants?owner_id=${safeOwnerId}`, { headers });
        if (!resReq.ok) throw new Error("Failed to fetch restaurants");
        const myRestaurants = await resReq.json();
        
        setRestaurants(myRestaurants);

        // 2. Fetch Reviews for each restaurant from Port 8003
        let allReviews = [];
        for (const rest of myRestaurants) {
          try {
            const restId = rest.id || rest._id;
            const revReq = await fetch(`http://localhost:8003/api/restaurants/${restId}/reviews`, { headers });
            if (revReq.ok) {
              const revData = await revReq.json();
              const revsWithName = revData.map(r => ({ ...r, restaurant_name: rest.name }));
              allReviews = [...allReviews, ...revsWithName];
            }
          } catch (err) {
            console.error(`Failed to fetch reviews for ${rest.name}`);
          }
        }
        
        allReviews.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setReviews(allReviews);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, role, isAuthenticated, authLoading, navigate]);

  const handleEditChange = (e) => {
    setEditingRest({ ...editingRest, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('token');
      const restId = editingRest.id || editingRest._id;
      
      const response = await fetch(`http://localhost:8002/api/restaurants/${restId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingRest.name,
          cuisine: editingRest.cuisine,
          address: editingRest.address,
          city: editingRest.city,
          description: editingRest.description,
          phone: editingRest.phone,
          hours: editingRest.hours
        })
      });

      if (!response.ok) throw new Error("Update failed");
      const updatedData = await response.json();
      
      setRestaurants(restaurants.map(r => (r.id || r._id) === restId ? updatedData : r));
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => {
        setMsg({ type: '', text: '' });
        setEditingRest(null);
      }, 2000);
      
    } catch (error) {
      setMsg({ type: 'error', text: 'Failed to update profile. Make sure the PUT endpoint exists in main.py!' });
    }
  };

  const totalLocations = restaurants.length;
  const totalReviews = reviews.length;
  const avgRating = totalReviews === 0 ? 0 : (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1);

  if (authLoading || loading) return <div className="p-10 text-center text-gray-500 font-medium">Loading Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 min-h-screen">
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Business Dashboard</h1>
        <Link to="/add-business" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md transition-colors shadow-sm">
          + Add New Location
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Locations</p>
          <p className="text-4xl font-black text-gray-900">{totalLocations}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Reviews</p>
          <p className="text-4xl font-black text-gray-900">{totalReviews}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Average Rating</p>
          <p className="text-4xl font-black text-green-600 flex items-center gap-2">
            {avgRating} 
            <svg className="w-8 h-8 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Your Restaurants</h2>
      <div className="space-y-4 mb-12">
        {restaurants.length === 0 ? (
          <p className="text-gray-500 italic bg-white p-6 rounded-xl border border-gray-100">No locations claimed yet.</p>
        ) : (
          restaurants.map(rest => (
            <div key={rest.id || rest._id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{rest.name}</h3>
                <p className="text-sm text-gray-500">{rest.address}, {rest.city}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  {Number(rest.average_rating || 0).toFixed(1)} <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </span>
                <button onClick={() => setEditingRest(rest)} className="text-red-600 font-bold text-sm hover:underline">
                  Edit Details
                </button>
                <Link to={`/restaurant/${rest.id || rest._id}`} className="text-blue-600 font-bold text-sm hover:underline">
                  View Public Page
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Customer Reviews</h2>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">No reviews yet.</p>
        ) : (
          <div className="space-y-6 divide-y divide-gray-100">
            {reviews.map((rev, idx) => (
              <div key={rev.id || idx} className="pt-6 first:pt-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">For: {rev.restaurant_name}</span>
                    <div className="flex items-center gap-1 mt-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={`w-4 h-4 ${star <= rev.rating ? 'text-orange-500 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 font-medium">
                    {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <p className="text-gray-800 italic mt-2">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingRest && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Edit Details for {editingRest.name}</h2>
              <button onClick={() => setEditingRest(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6">
              {msg.text && (
                <div className={`mb-6 p-4 rounded-md text-sm font-bold ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {msg.text}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Restaurant Name</label>
                    <input type="text" name="name" value={editingRest.name || ''} onChange={handleEditChange} required className="w-full bg-gray-50 border border-gray-300 text-sm rounded-md p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Cuisine Type</label>
                    <input type="text" name="cuisine" value={editingRest.cuisine || ''} onChange={handleEditChange} required className="w-full bg-gray-50 border border-gray-300 text-sm rounded-md p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Address / Location</label>
                    <input type="text" name="address" value={editingRest.address || ''} onChange={handleEditChange} required className="w-full bg-gray-50 border border-gray-300 text-sm rounded-md p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                    <input type="text" name="city" value={editingRest.city || ''} onChange={handleEditChange} required className="w-full bg-gray-50 border border-gray-300 text-sm rounded-md p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Contact Phone</label>
                    <input type="text" name="phone" value={editingRest.phone || ''} onChange={handleEditChange} placeholder="(555) 555-5555" className="w-full bg-gray-50 border border-gray-300 text-sm rounded-md p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Hours of Operation</label>
                    <input type="text" name="hours" value={editingRest.hours || ''} onChange={handleEditChange} placeholder="e.g. Mon-Fri 9AM-10PM" className="w-full bg-gray-50 border border-gray-300 text-sm rounded-md p-2.5" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea name="description" value={editingRest.description || ''} onChange={handleEditChange} rows="4" className="w-full bg-gray-50 border border-gray-300 text-sm rounded-md p-2.5 resize-none"></textarea>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingRest(null)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default OwnerDashboard;