import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const RoleRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = role === allowedRole || 
                    (role === 'user' && (allowedRole === 'buyer' || allowedRole === 'seller'));

  if (!isAllowed) {
    alert("You do not have permission to access this page.");
    const fallbackPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleRoute;
