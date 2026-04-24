import React from 'react';

const PhotoGalleryModal = ({ isOpen, onClose, photos, restaurantName }) => {
  if (!isOpen) return null;

  // Function to build full image URL from backend static path
  const getImageUrl = (filename) => {
    return `http://localhost:8000/static/restaurant_photos/${filename}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-80 transition-opacity" aria-hidden="true"></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-7xl">
          
          {/* Header (Matching Yelp Screenshot) */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10 flex items-center gap-4">
            <button onClick={onClose} className="text-gray-600 hover:text-black transition-colors flex items-center gap-2 font-bold">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              All photos
            </button>
            <h1 className="text-3xl font-extrabold text-gray-900 truncate">
              {restaurantName}
            </h1>
            <span className="ml-auto text-sm text-gray-500 font-medium">({photos.length} photos)</span>
          </div>

          {/* Photo Grid */}
          <div className="bg-white px-6 py-8">
            {photos.length === 0 ? (
              <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="mt-4 font-bold text-lg">No photos found</p>
                <p className="text-sm">Be the first to upload a photo for this business!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden group cursor-pointer border border-gray-100">
                    <img 
                      src={getImageUrl(photo.filename)} 
                      alt={`Photo of ${restaurantName}`}
                      className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Added {new Date(photo.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryModal;