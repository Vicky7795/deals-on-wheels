import React from 'react';
import { RotateCcw, Filter } from 'lucide-react';
import Button from '../common/Button';

const FilterSidebar = ({ filters, onFilterChange, onResetFilters }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Vehicles</span>
        </div>
        <button
          onClick={onResetFilters}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Vehicle Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Vehicle Type</label>
        <select
          value={filters.vehicleType || ''}
          onChange={(e) => onFilterChange('vehicleType', e.target.value)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-800"
        >
          <option value="">All Vehicle Types</option>
          <option value="Car">Car</option>
          <option value="SUV">SUV</option>
          <option value="Bike">Bike</option>
          <option value="Electric Vehicle">Electric Vehicle</option>
          <option value="Commercial Vehicle">Commercial Vehicle</option>
        </select>
      </div>

      {/* Fuel Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fuel Type</label>
        <select
          value={filters.fuelType || ''}
          onChange={(e) => onFilterChange('fuelType', e.target.value)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-800"
        >
          <option value="">All Fuel Types</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Electric">Electric</option>
          <option value="CNG">CNG</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      {/* Transmission */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Transmission</label>
        <div className="grid grid-cols-2 gap-2">
          {['', 'Manual', 'Automatic'].map((trans) => (
            <button
              key={trans}
              type="button"
              onClick={() => onFilterChange('transmission', trans)}
              className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                filters.transmission === trans
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {trans === '' ? 'All' : trans}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Condition</label>
        <div className="grid grid-cols-3 gap-2">
          {['', 'Used', 'New'].map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => onFilterChange('condition', cond)}
              className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors ${
                filters.condition === cond
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cond === '' ? 'All' : cond}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Price Range (₹)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Brand Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Brand</label>
        <input
          type="text"
          placeholder="e.g. Hyundai, Tata, Honda"
          value={filters.brand || ''}
          onChange={(e) => onFilterChange('brand', e.target.value)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* City Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Location / City</label>
        <input
          type="text"
          placeholder="e.g. Mumbai, Bengaluru"
          value={filters.city || ''}
          onChange={(e) => onFilterChange('city', e.target.value)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default FilterSidebar;
