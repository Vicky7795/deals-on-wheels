import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Gauge, Calendar, Fuel, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const VehicleCard = ({ vehicle, isFavorite = false, onToggleFavorite, showFavoriteButton = true }) => {
  const {
    _id,
    title,
    brand,
    model,
    year,
    price,
    vehicleType,
    fuelType,
    transmission,
    kilometersDriven,
    condition,
    city,
    images,
    status
  } = vehicle;

  const mainImage = images && images.length > 0
    ? images[0]
    : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusBadge = () => {
    if (status === 'sold') return <Badge variant="red">Sold</Badge>;
    if (status === 'reserved') return <Badge variant="amber">Reserved</Badge>;
    return <Badge variant="green">Available</Badge>;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Image container */}
      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {getStatusBadge()}
          <Badge variant="blue">{vehicleType}</Badge>
        </div>

        {/* Favorite Button */}
        {showFavoriteButton && onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(_id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${
              isFavorite
                ? 'bg-rose-600 text-white'
                : 'bg-white/90 text-gray-600 hover:text-rose-600 hover:bg-white'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold text-blue-600 uppercase tracking-wider">{brand}</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> {city}
            </span>
          </div>

          <Link to={`/vehicles/${_id}`}>
            <h3 className="text-base font-bold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors flex items-center gap-1.5">
              {title}
              {vehicle.approvalStatus === 'approved' && (
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" title="Verified Listing" />
              )}
            </h3>
          </Link>
        </div>

        {/* Specs Pill Row */}
        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg text-xs text-gray-600">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{year}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Gauge className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{kilometersDriven.toLocaleString('en-IN')} km</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Fuel className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{fuelType}</span>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Price</span>
            <span className="text-lg font-extrabold text-gray-900">{formatPrice(price)}</span>
          </div>

          <Link to={`/vehicles/${_id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
