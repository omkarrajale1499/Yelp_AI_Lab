import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import RestaurantCard from '../components/RestaurantCard';

const Explore = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Read both parameters from the URL
  const locationHook = useLocation();
  const searchParams = new URLSearchParams(locationHook.search);
  const searchQuery = searchParams.get('search') || '';
  const locationQuery = searchParams.get('location') || ''; 

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        // 2. Safely construct the endpoint with the new parameters
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (locationQuery) params.append('location', locationQuery);
        
        const endpoint = `/restaurants/?${params.toString()}`;
        const response = await axiosClient.get(endpoint);
        setRestaurants(response.data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [searchQuery, locationQuery]); // Trigger when either changes

  // 3. Dynamic header text based on what the user searched for
  let headerText = "Trending near you";
  if (searchQuery && locationQuery) {
      headerText = `Search results for "${searchQuery}" in ${locationQuery}`;
  } else if (searchQuery) {
      headerText = `Search results for "${searchQuery}"`;
  } else if (locationQuery) {
      headerText = `Restaurants in ${locationQuery}`;
  }

  const isFiltering = searchQuery || locationQuery;

  if (loading) return <div className="p-10 text-center text-gray-500 font-medium">Loading amazing places...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          {headerText}
        </h1>
        {isFiltering && (
          <Link to="/" className="text-red-600 font-medium hover:text-red-800 transition-colors flex items-center gap-1 w-fit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Clear Search
          </Link>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-medium text-lg">No restaurants found matching your criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try searching for a different cuisine or location.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {restaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
      <div className="mt-16 border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between bg-white shadow-sm border-dashed">
        <div className="flex items-center gap-5">
          <div className="bg-red-50 p-3 rounded-md text-red-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Can't find the business?</h3>
            <p className="text-gray-500 mt-1">Adding a business to YelpAI is always free.</p>
          </div>
        </div>
        <Link to="/add-business" className="mt-6 sm:mt-0 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-2.5 px-6 rounded-full transition-colors flex items-center gap-2">
          Add business
        </Link>
      </div>
    </div>
  );
};

export default Explore;