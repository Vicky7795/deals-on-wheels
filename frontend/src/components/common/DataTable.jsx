import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

const DataTable = ({
  headers = [],
  data = [],
  loading = false,
  emptyMessage = "No items found.",
  renderRow
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 bg-white border border-gray-200 rounded-xl">
        <EmptyState title="No Data Available" message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 font-bold border-b border-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
