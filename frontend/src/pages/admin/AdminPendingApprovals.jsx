import React from 'react';
import AdminVehicles from './AdminVehicles';

const AdminPendingApprovals = () => {
  return <AdminVehicles pendingOnly={true} />;
};

export default AdminPendingApprovals;
