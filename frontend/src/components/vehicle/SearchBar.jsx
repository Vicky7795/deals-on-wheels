import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Car } from 'lucide-react';
import Button from '../common/Button';

const SearchBar = ({ initialSearch = '', initialVehicleType = '', initialCity = '' }) => {
  const [search, setSearch] = useState(initialSearch);
  const [vehicleType, setVehicleType] = useState(initialVehicleType);
  const [city, setCity] = useState(initialCity);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (vehicleType) params.set('vehicleType', vehicleType);
    if (city.trim()) params.set('city', city.trim());

    navigate(`/browse?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white p-3 md:p-4 rounded-2xl shadow-lg border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-3"
    >
      {/* Search text input */}
      <div className="md:col-span-5 relative flex items-center">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by brand, model or title (e.g. Creta, Thar, Honda)"
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
        />
      </div>

      {/* Vehicle type dropdown */}
      <div className="md:col-span-3 relative flex items-center">
        <Car className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-700"
        >
          <option value="">All Vehicle Types</option>
          <option value="Car">Car</option>
          <option value="SUV">SUV</option>
          <option value="Bike">Bike</option>
          <option value="Electric Vehicle">Electric Vehicle</option>
          <option value="Commercial Vehicle">Commercial Vehicle</option>
        </select>
      </div>

      {/* City input */}
      <div className="md:col-span-2 relative flex items-center">
        <MapPin className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (e.g. Mumbai)"
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
        />
      </div>

      {/* Search Button */}
      <div className="md:col-span-2">
        <Button type="submit" variant="primary" size="lg" className="w-full h-full py-3" icon={Search}>
          Search
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
