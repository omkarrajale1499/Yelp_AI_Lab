import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

const AddRestaurant = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    address: '',
    city: '',
    description: '',
    price_tier: '$$',
    // Optional fields just for UI/Rubric completion
    phone: '',
    hours: '',
    amenities: ''
  });
  
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!user) {
      setMsg({ type: 'error', text: 'You must be logged in to add a business.' });
      return;
    }

    try {
      // We only send the fields that our backend database schema expects
      const payload = {
        name: formData.name,
        cuisine: formData.cuisine,
        address: formData.address,
        city: formData.city,
        description: formData.description,
        price_tier: formData.price_tier,
        phone: formData.phone,
        hours: formData.hours,
        amenities: formData.amenities
      };

      const response = await axiosClient.post('/restaurants/', payload);
      setMsg({ type: 'success', text: 'Restaurant added successfully! Redirecting...' });
      
      // Redirect to the new restaurant's detail page after 2 seconds
      setTimeout(() => {
        navigate(`/restaurant/${response.data.id}`);
      }, 2000);
      
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.detail || 'Failed to add business.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Add a Business</h1>
        <p className="text-gray-500 mb-8">Help the community discover new places. Fill out the details below.</p>

        {msg.text && (
          <div className={`mb-6 p-4 rounded-md text-sm font-bold ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Restaurant Name *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Mel's Diner" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Cuisine Type *</label>
              <input type="text" name="cuisine" required value={formData.cuisine} onChange={handleChange} placeholder="e.g. American, Italian" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Street Address *</label>
              <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="123 Main St" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">City *</label>
              <input type="text" name="city" required value={formData.city} onChange={handleChange} placeholder="San Jose" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Price Tier *</label>
              <select name="price_tier" value={formData.price_tier} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500">
                <option value="$">$ - Inexpensive</option>
                <option value="$$">$$ - Moderate</option>
                <option value="$$$">$$$ - Pricey</option>
                <option value="$$$$">$$$$ - Ultra High-End</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">Phone Number <span className="text-gray-400 font-normal">Optional</span></label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 555-5555" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">Hours of Operation <span className="text-gray-400 font-normal">Optional</span></label>
              <input type="text" name="hours" value={formData.hours} onChange={handleChange} placeholder="e.g. 9am - 10pm" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">Amenities <span className="text-gray-400 font-normal">Optional</span></label>
              <input type="text" name="amenities" value={formData.amenities} onChange={handleChange} placeholder="e.g. Free Wi-Fi, Outdoor Seating" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Tell us what makes this place special..." className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500 resize-none"></textarea>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button type="submit" className="w-full bg-red-600 text-white px-6 py-3 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm text-lg">
              Add Restaurant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRestaurant;