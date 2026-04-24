import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();

  // Helper to safely parse the JSON string from MySQL
  const getPhotoUrl = (photosData) => {
    const defaultImg = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=60';
    if (!photosData) return defaultImg;
    
    try {
      // If it's a raw string from MySQL, parse it into a real array. If it's already an array, use it.
      const photosArray = typeof photosData === 'string' ? JSON.parse(photosData) : photosData;
      return photosArray.length > 0 && photosArray[0] ? photosArray[0] : defaultImg;
    } catch (error) {
      return defaultImg;
    }
  };

  return (
    <div 
      onClick={() => navigate(`/restaurant/${restaurant.id}`)} 
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
    >
      <div className="h-48 bg-gray-200 overflow-hidden">
        <img 
          src={getPhotoUrl(restaurant.photos)}
          alt={restaurant.name}
          className="w-full h-48 object-cover rounded-t-xl"
          onError={(e) => {
            // If the provided URL is broken, instantly swap to the placeholder
            e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=60';
          }}
        />
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{restaurant.name}</h3>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
            {/* Updated to match backend schema */}
            {Number(restaurant.average_rating).toFixed(1)} ★ 
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-3">
          {/* Updated to match backend schema */}
          {restaurant.cuisine} • {restaurant.price_tier} 
        </p>
        <p className="text-gray-700 text-sm line-clamp-2 mb-4">
          {restaurant.description}
        </p>
        <Link 
          to={`/restaurant/${restaurant.id}`} 
          className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-red-600 font-semibold py-2 rounded-lg border border-gray-200 transition-colors"
          onClick={(e) => e.stopPropagation()} // <-- Prevents the outer div's onClick from firing twice
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default RestaurantCard;