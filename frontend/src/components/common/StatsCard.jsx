import React from 'react';

const StatsCard = ({ title, value, icon: Icon, description, trend, trendType = 'neutral', loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-3 w-2/3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const getTrendColor = () => {
    if (trendType === 'positive') return 'text-green-600 bg-green-50';
    if (trendType === 'negative') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
          <h3 className="text-3xl font-extrabold text-gray-900 leading-none">{value}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1.5">
              {trend && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getTrendColor()}`}>
                  {trend}
                </span>
              )}
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
