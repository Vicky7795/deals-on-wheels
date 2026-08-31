import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Car, Mail, Lock, ArrowRight, ShoppingBag, Store, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const from = location.state?.from?.pathname;
      navigate(from || (result.role === 'admin' ? '/admin/dashboard' : '/dashboard'), { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mx-auto shadow-md">
            <Car className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Deals on Wheels</h2>
          <p className="text-sm text-gray-500">Login to your account</p>
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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
              />
            </div>
          </div>


          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full py-3 shadow-md"
            isLoading={loading}
            icon={ArrowRight}
          >
            Login
          </Button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
            Register
          </Link>
        </div>

        {/* Visually distinct Admin Login section */}
        <div className="border-t border-gray-200 pt-5 space-y-3 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Are you an administrator?</p>
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="w-full py-2.5 px-4 border border-gray-300 hover:border-blue-900 text-blue-900 hover:bg-gray-50 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-blue-900" />
            Admin Login
          </button>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
          <p className="font-bold text-gray-800">Demo Accounts (Password: <code className="bg-gray-200 px-1 rounded">Password123</code>):</p>
          <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
            <button
              type="button"
              onClick={() => { setEmail('buyer1@example.com'); setPassword('Password123'); }}
              className="text-left font-medium text-blue-600 hover:underline"
            >
              • Buyer Demo 1
            </button>
            <button
              type="button"
              onClick={() => { setEmail('seller1@example.com'); setPassword('Password123'); }}
              className="text-left font-medium text-blue-600 hover:underline"
            >
              • Seller Demo 1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
