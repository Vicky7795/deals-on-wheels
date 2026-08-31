import React from 'react';
import { Car } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  title = 'No items found',
  description = 'There are no records to display right now.',
  icon: Icon = Car,
  actionLabel,
  onAction
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-10 text-center max-w-md mx-auto my-8 shadow-sm">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
