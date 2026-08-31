import React, { useState } from 'react';

const ImageGallery = ({ images = [] }) => {
  const defaultFallback = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80';
  const imageList = images && images.length > 0 ? images : [defaultFallback];
  const [selectedImage, setSelectedImage] = useState(imageList[0]);

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="aspect-[16/10] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
        <img
          src={selectedImage}
          alt="Vehicle Preview"
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={(e) => {
            e.target.src = defaultFallback;
          }}
        />
      </div>

      {/* Thumbnails */}
      {imageList.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {imageList.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img)}
              className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                selectedImage === img
                  ? 'border-blue-600 ring-2 ring-blue-500/20 opacity-100'
                  : 'border-gray-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = defaultFallback;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
