import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Protection
import ProtectedRoute from '../components/layout/ProtectedRoute';
import RoleRoute from '../components/layout/RoleRoute';

// Public Pages
import Home from '../pages/public/Home';
import Browse from '../pages/public/Browse';
import VehicleDetails from '../pages/public/VehicleDetails';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import About from '../pages/public/About';

// Unified Pages
import UnifiedDashboard from '../pages/UnifiedDashboard';
import Inquiries from '../pages/Inquiries';

// Buyer Pages
import BuyerDashboard from '../pages/buyer/BuyerDashboard';
import BuyerFavorites from '../pages/buyer/BuyerFavorites';
import BuyerInquiries from '../pages/buyer/BuyerInquiries';
import ConfirmPurchase from '../pages/buyer/ConfirmPurchase';
import BuyerOrders from '../pages/buyer/BuyerOrders';
import BuyerNotifications from '../pages/buyer/BuyerNotifications';
import BuyerProfile from '../pages/buyer/BuyerProfile';

// Seller Pages
import SellerDashboard from '../pages/seller/SellerDashboard';
import SellerVehicles from '../pages/seller/SellerVehicles';
import AddVehicle from '../pages/seller/AddVehicle';
import EditVehicle from '../pages/seller/EditVehicle';
import SellerInquiries from '../pages/seller/SellerInquiries';
import SellerOrders from '../pages/seller/SellerOrders';
import SellerPayments from '../pages/seller/SellerPayments';
import SellerNotifications from '../pages/seller/SellerNotifications';
import SellerProfile from '../pages/seller/SellerProfile';

// Admin Pages
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminSellers from '../pages/admin/AdminSellers';
import AdminBuyers from '../pages/admin/AdminBuyers';
import AdminVehicles from '../pages/admin/AdminVehicles';
import AdminPendingApprovals from '../pages/admin/AdminPendingApprovals';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminPayments from '../pages/admin/AdminPayments';
import AdminCommissions from '../pages/admin/AdminCommissions';
import AdminReports from '../pages/admin/AdminReports';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminNotifications from '../pages/admin/AdminNotifications';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminProfile from '../pages/admin/AdminProfile';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/vehicles/:id" element={<VehicleDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />

      {/* Protected Unified User Routes */}
      <Route
        path="/dashboard"
        element={
          <RoleRoute allowedRole="buyer">
            <UnifiedDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <RoleRoute allowedRole="buyer">
            <BuyerFavorites />
          </RoleRoute>
        }
      />
      <Route
        path="/my-listings"
        element={
          <RoleRoute allowedRole="seller">
            <SellerVehicles />
          </RoleRoute>
        }
      />
      <Route
        path="/my-purchases"
        element={
          <RoleRoute allowedRole="buyer">
            <BuyerOrders />
          </RoleRoute>
        }
      />
      <Route
        path="/inquiries"
        element={
          <RoleRoute allowedRole="buyer">
            <Inquiries />
          </RoleRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <RoleRoute allowedRole="buyer">
            <BuyerNotifications />
          </RoleRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <RoleRoute allowedRole="buyer">
            <BuyerProfile />
          </RoleRoute>
        }
      />
      <Route
        path="/sell"
        element={
          <RoleRoute allowedRole="seller">
            <AddVehicle />
          </RoleRoute>
        }
      />
      <Route
        path="/sell/:id/edit"
        element={
          <RoleRoute allowedRole="seller">
            <EditVehicle />
          </RoleRoute>
        }
      />

      {/* Add & Edit Vehicle Routes (Both /sell and /seller/vehicles paths supported) */}
      <Route
        path="/seller/vehicles"
        element={
          <RoleRoute allowedRole="seller">
            <SellerVehicles />
          </RoleRoute>
        }
      />
      <Route
        path="/seller/vehicles/add"
        element={
          <RoleRoute allowedRole="seller">
            <AddVehicle />
          </RoleRoute>
        }
      />
      <Route
        path="/seller/vehicles/:id/edit"
        element={
          <RoleRoute allowedRole="seller">
            <EditVehicle />
          </RoleRoute>
        }
      />

      {/* Redirect Legacy User Routes */}
      <Route path="/buyer/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/buyer/browse" element={<Navigate to="/browse" replace />} />
      <Route path="/buyer/favorites" element={<Navigate to="/favorites" replace />} />
      <Route path="/buyer/inquiries" element={<Navigate to="/inquiries" replace />} />
      <Route path="/buyer/orders" element={<Navigate to="/my-purchases" replace />} />
      <Route path="/buyer/notifications" element={<Navigate to="/notifications" replace />} />
      <Route path="/buyer/profile" element={<Navigate to="/profile" replace />} />

      {/* Seller Routes */}
      <Route
        path="/seller/dashboard"
        element={
          <RoleRoute allowedRole="seller">
            <SellerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/seller/orders"
        element={
          <RoleRoute allowedRole="seller">
            <SellerOrders />
          </RoleRoute>
        }
      />
      <Route
        path="/seller/payments"
        element={
          <RoleRoute allowedRole="seller">
            <SellerPayments />
          </RoleRoute>
        }
      />
      <Route
        path="/seller/notifications"
        element={
          <RoleRoute allowedRole="seller">
            <SellerNotifications />
          </RoleRoute>
        }
      />
      <Route
        path="/seller/profile"
        element={
          <RoleRoute allowedRole="seller">
            <SellerProfile />
          </RoleRoute>
        }
      />
      <Route
        path="/seller/inquiries"
        element={
          <RoleRoute allowedRole="seller">
            <SellerInquiries />
          </RoleRoute>
        }
      />

      {/* Checkout and Orders */}
      <Route
        path="/buyer/checkout/:id"
        element={
          <RoleRoute allowedRole="buyer">
            <ConfirmPurchase />
          </RoleRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute allowedRole="admin">
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RoleRoute allowedRole="admin">
            <AdminUsers />
          </RoleRoute>
        }
      />
      
      {/* Redirect Legacy Admin Sub-roles */}
      <Route path="/admin/sellers" element={<Navigate to="/admin/users" replace />} />
      <Route path="/admin/buyers" element={<Navigate to="/admin/users" replace />} />

      <Route
        path="/admin/vehicles"
        element={
          <RoleRoute allowedRole="admin">
            <AdminVehicles />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/vehicles/pending"
        element={
          <RoleRoute allowedRole="admin">
            <AdminPendingApprovals />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <RoleRoute allowedRole="admin">
            <AdminOrders />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <RoleRoute allowedRole="admin">
            <AdminPayments />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/commissions"
        element={
          <RoleRoute allowedRole="admin">
            <AdminCommissions />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <RoleRoute allowedRole="admin">
            <AdminReports />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <RoleRoute allowedRole="admin">
            <AdminCategories />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <RoleRoute allowedRole="admin">
            <AdminNotifications />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RoleRoute allowedRole="admin">
            <AdminSettings />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <RoleRoute allowedRole="admin">
            <AdminProfile />
          </RoleRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
