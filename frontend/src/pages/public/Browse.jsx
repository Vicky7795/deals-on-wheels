import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterSidebar from '../../components/vehicle/FilterSidebar';
import VehicleGrid from '../../components/vehicle/VehicleGrid';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/vehicle/SearchBar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SlidersHorizontal } from 'lucide-react';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role, isAuthenticated } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [favoritesMap, setFavoritesMap] = useState({});
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Read query parameters
  const currentSearch = searchParams.get('search') || '';
  const currentVehicleType = searchParams.get('vehicleType') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentFuelType = searchParams.get('fuelType') || '';
  const currentTransmission = searchParams.get('transmission') || '';
  const currentCondition = searchParams.get('condition') || '';
  const currentCity = searchParams.get('city') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const filters = {
    search: currentSearch,
    vehicleType: currentVehicleType,
    brand: currentBrand,
    fuelType: currentFuelType,
    transmission: currentTransmission,
    condition: currentCondition,
    city: currentCity,
    minPrice: currentMinPrice,
    maxPrice: currentMaxPrice,
    sort: currentSort,
    page: currentPage
  };

  // Fetch vehicles from backend API
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSearch) params.set('search', currentSearch);
      if (currentVehicleType) params.set('vehicleType', currentVehicleType);
      if (currentBrand) params.set('brand', currentBrand);
      if (currentFuelType) params.set('fuelType', currentFuelType);
      if (currentTransmission) params.set('transmission', currentTransmission);
      if (currentCondition) params.set('condition', currentCondition);
      if (currentCity) params.set('city', currentCity);
      if (currentMinPrice) params.set('minPrice', currentMinPrice);
      if (currentMaxPrice) params.set('maxPrice', currentMaxPrice);
      if (currentSort) params.set('sort', currentSort);
      params.set('page', currentPage);
      params.set('limit', 9);

      const res = await api.get(`/vehicles?${params.toString()}`);
      if (res.data.success) {
        setVehicles(res.data.data.vehicles || []);
        setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch buyer favorites if logged in as buyer
  const fetchFavorites = async () => {
    if (isAuthenticated && role === 'buyer') {
      try {
        const res = await api.get('/favorites');
        if (res.data.success) {
          const map = {};
          (res.data.data || []).forEach((fav) => {
            if (fav.vehicleId && fav.vehicleId._id) {
              map[fav.vehicleId._id] = true;
            }
          });
          setFavoritesMap(map);
        }
      } catch (e) {
        console.error('Failed to load favorites:', e);
      }
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [searchParams]);

  useEffect(() => {
    fetchFavorites();
  }, [isAuthenticated, role]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  const handleToggleFavorite = async (vehicleId) => {
    if (!isAuthenticated) {
      alert('Please log in as a Buyer to save favorite vehicles.');
      return;
    }
    if (role !== 'buyer') {
      alert('Favorite feature is available for Buyer accounts only.');
      return;
    }

    try {
      if (favoritesMap[vehicleId]) {
        await api.delete(`/favorites/${vehicleId}`);
        setFavoritesMap((prev) => ({ ...prev, [vehicleId]: false }));
      } else {
        await api.post(`/favorites/${vehicleId}`);
        setFavoritesMap((prev) => ({ ...prev, [vehicleId]: true }));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update favorite status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Search Bar */}
      <div>
        <SearchBar
          initialSearch={currentSearch}
          initialVehicleType={currentVehicleType}
          initialCity={currentCity}
        />
      </div>

      {/* Control bar: Mobile filter toggle & Sort dropdown */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <span className="text-sm font-semibold text-gray-700">
            Found <span className="text-blue-600 font-bold">{pagination.total}</span> vehicles
          </span>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase hidden sm:inline">Sort By:</label>
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 text-gray-800"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Grid + Filter Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className={`${showMobileFilter ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
          <FilterSidebar
            filters={filters}
            onFilterChange={updateParam}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Right Listings Grid */}
        <div className="lg:col-span-3 space-y-6">
          <VehicleGrid
            vehicles={vehicles}
            loading={loading}
            favoritesMap={favoritesMap}
            onToggleFavorite={handleToggleFavorite}
            showFavoriteButton={role === 'buyer' || !isAuthenticated}
          />

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(page) => updateParam('page', page)}
          />
        </div>
      </div>
    </div>
  );
};

export default Browse;
