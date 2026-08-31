import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Car, Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);

    if (result.success) {
      if (result.role !== 'admin') {
        logout(); // Immediately discard session for non-admin role
        setError('You do not have administrator access.');
        setLoading(false);
      } else {
        setLoading(false);
        navigate('/admin/dashboard');
      }
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-white mx-auto shadow-md">
            <ShieldAlert className="w-7 h-7 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Admin Login</h2>
          <p className="text-sm text-gray-500">Sign in to manage Deals on Wheels</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dealsonwheels.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-gray-900"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full py-3 shadow-md bg-blue-900 hover:bg-blue-950 focus:ring-blue-900"
            isLoading={loading}
            icon={ArrowRight}
          >
            Sign In
          </Button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors"
          >
            ← Back to public login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
