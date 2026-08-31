import React from 'react';
import VehicleCard from './VehicleCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const VehicleGrid = ({
  vehicles = [],
  loading = false,
  favoritesMap = {},
  onToggleFavorite,
  showFavoriteButton = true,
  emptyTitle = 'No vehicles found',
  emptyDescription = 'Try adjusting your search terms or filters.'
}) => {
  if (loading) {
    return <LoadingSpinner message="Searching available vehicles..." />;
  }

  if (!vehicles || vehicles.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle._id}
          vehicle={vehicle}
          isFavorite={!!favoritesMap[vehicle._id]}
          onToggleFavorite={onToggleFavorite}
          showFavoriteButton={showFavoriteButton}
        />
      ))}
    </div>
  );
};

export default VehicleGrid;
