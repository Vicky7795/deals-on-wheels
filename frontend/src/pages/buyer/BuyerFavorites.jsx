import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import VehicleCard from '../../components/vehicle/VehicleCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { Heart } from 'lucide-react';

const BuyerFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await api.get('/favorites');
      if (res.data.success) {
        setFavorites(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (vehicleId) => {
    try {
      await api.delete(`/favorites/${vehicleId}`);
      setFavorites(prev => prev.filter(f => f.vehicleId && f.vehicleId._id !== vehicleId));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to remove favorite.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-600" /> My Saved Favorites
          </h1>
          <p className="text-sm text-gray-500 mt-1">Vehicles you have bookmarked for easy reference</p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading saved vehicles..." />
        ) : favorites.length === 0 ? (
          <EmptyState
            title="You haven't saved any vehicles yet"
            description="Explore our marketplace and click the heart icon on any vehicle to add it to your favorites."
            icon={Heart}
            actionLabel="Browse Marketplace"
            onAction={() => window.location.href = '/browse'}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const veh = fav.vehicleId;
              if (!veh) return null;
              return (
                <VehicleCard
                  key={fav._id}
                  vehicle={veh}
                  isFavorite={true}
                  onToggleFavorite={() => handleRemoveFavorite(veh._id)}
                  showFavoriteButton={true}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BuyerFavorites;
