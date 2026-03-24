import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import PhotoGalleryModal from '../components/PhotoGalleryModal';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useContext(AuthContext);
  
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [photos, setPhotos] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Review States
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  
  // New States for photo gallery
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Ref for the hidden file input
  const fileInputRef = useRef(null);

  // Function to build full image URL from backend static path
  const getImageUrl = (filename) => {
    return `http://localhost:8000/static/restaurant_photos/${filename}`;
  };

  // Helper: Smart Images based on Cuisine
  const getRestaurantImages = (cuisine) => {
     const type = cuisine?.toLowerCase() || '';
    if (type.includes('italian') || type.includes('pizza')) {
      return [
        "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&q=80&w=1000"
      ];
    }
    if (type.includes('vegan') || type.includes('salad')) {
      return [
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1498837167922-41cfa6dbb19c?auto=format&fit=crop&q=80&w=1000"
      ];
    }
    if (type.includes('seafood') || type.includes('fish')) {
      return [
        "https://images.unsplash.com/photo-1615141982883-c7da0e698b0b?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&q=80&w=1000"
      ];
    }
    return [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1414235077428-338988692f3b?auto=format&fit=crop&q=80&w=1000"
    ];
  };

  // --- NEW: Dynamic Real-Time Hours Calculator ---
  const getDynamicHours = (restId) => {
    const now = new Date();
    const currentDayIndex = now.getDay(); 
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const schedules = ['11:00 AM - 9:00 PM', '12:00 PM - 10:00 PM', '10:00 AM - 8:00 PM', '4:00 PM - 11:00 PM'];
    const baseTime = schedules[restId % schedules.length];

    const parseTime = (timeStr) => {
      if (!timeStr || timeStr === 'Closed') return 0;
      const parts = timeStr.trim().split(' ');
      if (parts.length < 2) return 0;
      const time = parts[0];
      const modifier = parts[1];
      let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
      return hours * 60 + minutes;
    };

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const jsDayMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };

    return days.map(dayName => {
      let timeString = baseTime;
      
      if (dayName === 'Mon' && restId % 3 === 0) timeString = 'Closed';
      if (dayName === 'Sun' && restId % 2 === 0) timeString = 'Closed';
      if (dayName === 'Fri' || dayName === 'Sat') {
          if (timeString !== 'Closed') timeString = timeString.replace('PM', 'PM (Extended)');
      }

      let isCurrentlyOpen = false;
      let isToday = (jsDayMap[dayName] === currentDayIndex);

      if (isToday && timeString !== 'Closed') {
        const cleanTimeStr = timeString.replace('(Extended)', '').trim();
        const [openStr, closeStr] = cleanTimeStr.split('-');
        
        if (openStr && closeStr) {
          const openMins = parseTime(openStr);
          let closeMins = parseTime(closeStr);
          
          if (closeMins < openMins) closeMins += 24 * 60; // Handle past-midnight
          
          let compareMins = currentMinutes;
          if (currentMinutes < openMins && currentMinutes < (closeMins % (24*60))) {
              compareMins += 24 * 60;
          }

          if (compareMins >= openMins && compareMins <= closeMins) {
            isCurrentlyOpen = true;
          }
        }
      }

      return { day: dayName, time: timeString, isOpen: isCurrentlyOpen, isToday: isToday };
    });
  };
  // -----------------------------------------------

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const [resRes, revRes, photoRes] = await Promise.all([
          axiosClient.get(`/restaurants/${id}`),
          axiosClient.get(`/restaurants/${id}/reviews`),
          axiosClient.get(`/restaurants/${id}/photos`)
        ]);
        setRestaurant(resRes.data);
        setReviews(revRes.data);
        setPhotos(photoRes.data);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantData();
  }, [id]);

  const handleFavorite = async () => {
    if (!user) return navigate('/login');
    try {
      await axiosClient.post(`/favorites/${id}`);
      setSuccessMsg("Saved to your collections!");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error favoriting:", error);
    }
  };


  const handleClaimBusiness = async () => {
    if (!user) return navigate('/login');
    try {
      const response = await axiosClient.put(`/restaurants/${id}/claim`);
      setRestaurant(response.data); 
      setSuccessMsg("Business successfully claimed! It will now appear in your dashboard.");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setSubmitError(error.response?.data?.detail || "Failed to claim business. Make sure you are logged in as an Owner.");
      setTimeout(() => setSubmitError(''), 4000);
    }
  };

  const handleAddPhotoClick = () => {
    if (!user) return navigate('/login');
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSubmitError(''); setSuccessMsg('Uploading photo...');
      
      const formData = new FormData();
      formData.append('file', e.target.files[0]);

      try {
        const response = await axiosClient.post(`/restaurants/${id}/photos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        setPhotos(prev => [response.data, ...prev]);
        setSuccessMsg("Photo added to the business album!");
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (error) {
        setSubmitError(error.response?.data?.detail || "Failed to upload photo.");
        setSuccessMsg('');
      } finally {
        e.target.value = null; 
      }
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(''); setSuccessMsg('');
    if (!user) return navigate('/login');

    try {
      const response = await axiosClient.post(`/restaurants/${id}/reviews`, {
        rating: Number(rating),
        comment: comment
      });
      
      setReviews([{ ...response.data, created_at: new Date().toISOString() }, ...reviews]);
      setComment(''); setRating(5);
      setSuccessMsg('Review submitted successfully!');
      
      setRestaurant(prev => ({
        ...prev,
        review_count: prev.review_count + 1,
        average_rating: ((prev.average_rating * prev.review_count) + Number(rating)) / (prev.review_count + 1)
      }));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setSubmitError(error.response?.data?.detail || "Failed to submit review.");
    }
  };


  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    
    try {
      await axiosClient.delete(`/reviews/${reviewId}`);
      setReviews(reviews.filter(r => r.id !== reviewId));
      setSuccessMsg("Review deleted successfully.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setSubmitError("Failed to delete review.");
    }
  };

  const startEditing = (review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleEditSubmit = async (reviewId) => {
    try {
      const response = await axiosClient.put(`/reviews/${reviewId}`, {
        rating: Number(editRating),
        comment: editComment
      });
      
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, rating: response.data.rating, comment: response.data.comment } : r));
      setEditingReviewId(null); 
      setSuccessMsg("Review updated successfully.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setSubmitError("Failed to update review.");
    }
  };

  const renderStars = (avgRating, sizeClass = "w-8 h-8") => {
    const rounded = Math.round(avgRating * 2) / 2;
    const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
    
    return [1, 2, 3, 4, 5].map(star => {
      if (rounded >= star) {
        return <svg key={star} className={`${sizeClass} text-red-500 fill-current`} viewBox="0 0 20 20"><path d={starPath} /></svg>;
      } else if (rounded >= star - 0.5) {
        return (
          <svg key={star} className={`${sizeClass}`} viewBox="0 0 20 20">
            <defs>
              <clipPath id={`half-star-${star}`}>
                <rect x="0" y="0" width="10" height="20" /> 
              </clipPath>
            </defs>
            <path d={starPath} className="text-gray-300 fill-current" />
            <path d={starPath} className="text-red-500 fill-current" clipPath={`url(#half-star-${star})`} />
          </svg>
        );
      } else {
        return <svg key={star} className={`${sizeClass} text-gray-300 fill-current`} viewBox="0 0 20 20"><path d={starPath} /></svg>;
      }
    });
  };

  const scrollToReview = () => {
    document.getElementById('review-section').scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToReviewsList = (e) => {
    e.stopPropagation();
    document.getElementById('recommended-reviews').scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <div className="p-10 text-center text-gray-500 font-medium">Loading details...</div>;
  if (!restaurant) return <div className="p-10 text-center text-red-500 font-bold text-xl">Restaurant not found.</div>;

  const currentHours = getDynamicHours(restaurant.id);
  // Grab the exact schedule block for 'today'
  const todaySchedule = currentHours.find(h => h.isToday) || currentHours[0];
  
  const unspashFallbackImages = getRestaurantImages(restaurant.cuisine);
  const heroImageSources = photos.length >= 3 
    ? [getImageUrl(photos[0].filename), getImageUrl(photos[1].filename), getImageUrl(photos[2].filename)]
    : unspashFallbackImages;

  return (
    <div className="bg-white min-h-screen">
      
      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[400px] bg-gray-900 overflow-hidden flex cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
        <div className="w-1/3 h-full bg-cover bg-center opacity-70" style={{ backgroundImage: `url('${heroImageSources[0]}')`}}></div>
        <div className="w-1/3 h-full bg-cover bg-center opacity-70 border-x-4 border-gray-900" style={{ backgroundImage: `url('${heroImageSources[1]}')`}}></div>
        <div className="w-1/3 h-full bg-cover bg-center opacity-70" style={{ backgroundImage: `url('${heroImageSources[2]}')`}}></div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>

        <div className="absolute bottom-0 left-0 w-full p-8 max-w-7xl mx-auto flex flex-col justify-end">
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">{restaurant.name}</h1>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="flex">
              {renderStars(restaurant.average_rating, "w-8 h-8")}
            </div>
            <span onClick={scrollToReviewsList} className="text-gray-300 font-normal text-lg">({restaurant.review_count} reviews)</span>
          </div>
          
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 text-white text-lg font-medium">
                {restaurant.owner_id ? (
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-sm flex items-center gap-1 border border-blue-400/30 cursor-default" title="Verified Business">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Claimed
                  </span>
                ) : role === 'owner' ? (
                  <button 
                    onClick={handleClaimBusiness} 
                    className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 px-2 py-0.5 rounded text-sm flex items-center gap-1 border border-orange-400/30 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                    Unclaimed - Claim this business
                  </button>
                ) : (
                  <span className="bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded text-sm flex items-center gap-1 border border-gray-400/30 cursor-default">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Unclaimed
                  </span>
                )}
                <span className="text-gray-300">•</span>
                <span>{restaurant.price_tier}</span>
                <span className="text-gray-300">•</span>
                <span>{restaurant.cuisine}</span>
              </div>

              <button onClick={() => setIsGalleryOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                See all {photos.length} photos
              </button>
          </div>
          
          <div className="mt-3 text-white font-bold flex items-center gap-2">
            {/* UPDATED: Dynamic real-time status in hero section */}
            <span className={todaySchedule.isOpen ? "text-green-400" : "text-red-400"}>
              {todaySchedule.isOpen ? "Open" : "Closed"}
            </span> {todaySchedule.time}
            <button className="text-gray-300 font-normal hover:underline ml-2 flex items-center gap-1 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              See hours
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Alerts */}
        {(submitError || successMsg) && (
            <div className={`mb-6 p-4 rounded-md text-sm font-bold border ${submitError ? 'bg-red-50 text-red-800 border-red-100' : 'bg-green-50 text-green-800 border-green-100'}`}>
                {submitError || successMsg}
            </div>
        )}

        {/* 2. ACTION BAR */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 pb-6 mb-8">
          <button onClick={scrollToReview} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-md font-bold transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Write a review
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <button onClick={handleAddPhotoClick} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-md font-bold transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Add photo
          </button>
          
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-md font-bold transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share
          </button>
          <button onClick={handleFavorite} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-md font-bold transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            Save
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Business</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{restaurant.description || "No description provided yet."}</p>
            </section>

            <hr className="border-gray-200" />

            {/* Location & Hours */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Location & Hours</h2>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Map & Address Area */}
                <div className="flex-1">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center border border-gray-300 overflow-hidden relative">
                    <img src="https://maps.googleapis.com/maps/api/staticmap?center=San+Jose,CA&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7CSan+Jose,CA&key=YOUR_API_KEY_HERE" alt="Map" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute bg-white px-3 py-1 rounded shadow-md font-bold text-sm text-gray-800">Map Placeholder</div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-blue-600 hover:underline cursor-pointer">{restaurant.address}</p>
                      <p className="font-bold text-gray-900">{restaurant.city}</p>
                    </div>
                    <button className="border border-gray-300 rounded px-4 py-1.5 font-bold text-sm hover:bg-gray-50 transition-colors">
                      Get directions
                    </button>
                  </div>
                </div>

                {/* Hours Table */}
                <div className="flex-1">
                  <table className="w-full text-sm">
                    <tbody>
                      {/* UPDATED: Dynamic background coloring and open/closed logic per row */}
                      {currentHours.map((schedule, idx) => (
                        <tr key={idx} className={`border-b border-gray-100 last:border-0 ${schedule.isToday ? 'bg-gray-50' : ''}`}>
                          <td className={`py-2 w-16 ${schedule.isToday ? 'font-extrabold text-black' : 'font-bold text-gray-900'}`}>{schedule.day}</td>
                          <td className={`py-2 ${schedule.isToday ? 'font-semibold text-black' : 'text-gray-700'}`}>{schedule.time}</td>
                          <td className="py-2 text-right">
                            {schedule.isToday && (
                                schedule.isOpen 
                                  ? <span className="text-green-600 font-bold">Open now</span> 
                                  : <span className="text-red-500 font-bold">Closed now</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* Review Form Section */}
            <section id="review-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Write a Review</h2>
              {!user ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">You must be logged in to leave a review.</p>
                  <button onClick={() => navigate('/login')} className="bg-red-600 text-white px-6 py-2 rounded-md font-bold hover:bg-red-700 transition-colors">
                    Log In to Review
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Rating</label>
                    <select value={rating} onChange={(e) => setRating(e.target.value)} className="w-full sm:w-48 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-2.5 outline-none focus:border-red-500">
                      <option value="5">5 Stars - Excellent</option>
                      <option value="4">4 Stars - Very Good</option>
                      <option value="3">3 Stars - Average</option>
                      <option value="2">2 Stars - Poor</option>
                      <option value="1">1 Star - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Your Experience</label>
                    <textarea rows="4" required value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-3 outline-none resize-none focus:border-red-500" placeholder="Doesn't look like much when you walk past, but I was practically blown away by the food..."></textarea>
                  </div>
                  <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm">
                    Post Review
                  </button>
                </form>
              )}
            </section>

            {/* Recommended Reviews */}
            <section id="recommended-reviews">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-500 italic">No reviews yet. Be the first to share your thoughts!</p>
              ) : (
                <div className="space-y-8 mt-6">
                  {reviews.map((rev, index) => {
                    const isOwner = user && user.id === rev.user_id; 
                    const isEditing = editingReviewId === rev.id;

                    return (
                      <div key={rev.id || index} className="border-b border-gray-200 pb-8 last:border-0 relative">
                        
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xl overflow-hidden shadow-inner">
                              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=User${rev.user_id}`} alt="avatar" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">
                                {isOwner ? `${user.name} (You)` : 'YelpAI Member'}
                              </p>
                              <p className="text-sm text-gray-500 font-medium">San Jose, CA</p>
                            </div>
                          </div>

                          {isOwner && !isEditing && (
                            <div className="flex gap-3">
                              <button onClick={() => startEditing(rev)} className="text-sm font-bold text-blue-600 hover:text-blue-800">Edit</button>
                              <button onClick={() => handleDeleteReview(rev.id)} className="text-sm font-bold text-red-600 hover:text-red-800">Delete</button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                            <select value={editRating} onChange={(e) => setEditRating(e.target.value)} className="mb-3 block w-32 bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-2 outline-none">
                              <option value="5">5 Stars</option>
                              <option value="4">4 Stars</option>
                              <option value="3">3 Stars</option>
                              <option value="2">2 Stars</option>
                              <option value="1">1 Star</option>
                            </select>
                            <textarea rows="3" value={editComment} onChange={(e) => setEditComment(e.target.value)} className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md p-3 outline-none resize-none mb-3"></textarea>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditSubmit(rev.id)} className="bg-red-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-red-700">Save Changes</button>
                              <button onClick={() => setEditingReviewId(null)} className="bg-gray-200 text-gray-800 px-4 py-1.5 rounded text-sm font-bold hover:bg-gray-300">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex">
                                {renderStars(rev.rating, "w-5 h-5")}
                              </div>
                              <span className="text-gray-500 text-sm">
                                {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Mar 6, 2026'}
                              </span>
                              {rev.created_at && rev.updated_at && rev.created_at !== rev.updated_at && (
                                <span className="text-xs text-gray-400 italic ml-2">(Edited)</span>
                              )}
                            </div>
                            <p className="text-gray-800 text-lg leading-relaxed">{rev.comment}</p>
                          </>
                        )}
                        
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column/Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-gray-200 rounded-lg shadow-sm p-0 divide-y divide-gray-200">
              
              <a href="#" className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors group">
                <span className="font-bold text-blue-600 group-hover:underline truncate w-48">
                  {restaurant.name.toLowerCase().replace(/\s/g, '')}.com
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>

              <div className="flex justify-between items-center p-4">
                <span className="font-bold text-gray-900">(408) 555-0198</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>

              <a href="#" className="flex justify-between items-start p-4 hover:bg-gray-50 transition-colors group">
                <div>
                  <span className="font-bold text-blue-600 group-hover:underline block mb-1">Get Directions</span>
                  <span className="text-gray-600 text-sm">{restaurant.address}<br/>{restaurant.city}, CA</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </a>

            </div>
          </div>

        </div>
      </div>

      <PhotoGalleryModal 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
        photos={photos}
        restaurantName={restaurant.name}
      />
    </div>
  );
};

export default RestaurantDetail;