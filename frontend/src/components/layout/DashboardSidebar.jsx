import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  Heart,
  MessageSquare,
  ShoppingBag,
  Bell,
  User,
  LogOut,
  Car,
  PlusCircle,
  Users,
  CreditCard,
  IndianRupee,
  AlertTriangle,
  Grid,
  Settings,
  ClipboardCheck
} from 'lucide-react';

const DashboardSidebar = ({ role = 'buyer' }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/browse', label: 'Browse Vehicles', icon: Search },
    { to: '/favorites', label: 'Favorites', icon: Heart },
    { to: '/inquiries', label: 'My Inquiries', icon: MessageSquare },
    { to: '/my-purchases', label: 'My Purchases', icon: ShoppingBag },
    { to: '/my-listings', label: 'My Listings', icon: Car },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'My Profile', icon: User }
  ];

  const buyerLinks = [
    { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/browse', label: 'Browse Vehicles', icon: Search },
    { to: '/buyer/favorites', label: 'Favorites', icon: Heart },
    { to: '/buyer/inquiries', label: 'My Inquiries', icon: MessageSquare },
    { to: '/buyer/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/buyer/notifications', label: 'Notifications', icon: Bell },
    { to: '/buyer/profile', label: 'My Profile', icon: User }
  ];

  const sellerLinks = [
    { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/seller/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/seller/vehicles/add', label: 'Add Vehicle', icon: PlusCircle },
    { to: '/seller/inquiries', label: 'Customer Inquiries', icon: MessageSquare },
    { to: '/seller/orders', label: 'Vehicle Orders', icon: ShoppingBag },
    { to: '/seller/payments', label: 'My Payouts', icon: CreditCard },
    { to: '/seller/notifications', label: 'Notifications', icon: Bell },
    { to: '/seller/profile', label: 'Seller Profile', icon: User }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/vehicles', label: 'Vehicle Listings', icon: Car },
    { to: '/admin/vehicles/pending', label: 'Pending Approvals', icon: ClipboardCheck },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/commissions', label: 'Commissions', icon: IndianRupee },
    { to: '/admin/reports', label: 'Reports', icon: AlertTriangle },
    { to: '/admin/categories', label: 'Categories', icon: Grid },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
    { to: '/admin/profile', label: 'Profile', icon: User }
  ];

  const activeRole = user?.role || role;

  let links = userLinks;
  if (activeRole === 'buyer') {
    links = buyerLinks;
  } else if (activeRole === 'seller') {
    links = sellerLinks;
  } else if (activeRole === 'admin') {
    links = adminLinks;
  }

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-gray-900 truncate">{user?.name}</h4>
            <span className="text-xs text-blue-700 font-medium capitalize bg-blue-100 px-2 py-0.5 rounded inline-block">
              {activeRole} Account
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/buyer/dashboard' || link.to === '/seller/dashboard' || link.to === '/admin/dashboard' || link.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
