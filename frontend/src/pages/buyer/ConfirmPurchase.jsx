import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, ShieldCheck, MapPin, CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';

const ConfirmPurchase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        setError('Invalid Vehicle ID. Please select a valid vehicle listing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/vehicles/${id}`);
        if (res.data.success) {
          setVehicle(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load vehicle details for purchase.');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiateOrder = async () => {
    if (!vehicle) return;

    setPurchasing(true);
    setError('');
    try {
      // 1. Create order on backend (status: payment_pending)
      const orderRes = await api.post('/orders', { vehicleId: vehicle._id });
      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create internal order.');
      }
      const orderData = orderRes.data.data;

      // 2. Initiate payment session on backend (creates real Razorpay Order via SDK)
      const payRes = await api.post('/payments/create', { orderId: orderData._id });
      if (!payRes.data.success) {
        throw new Error(payRes.data.message || 'Failed to initiate payment checkout.');
      }
      const { payment: paymentData, key, order_id } = payRes.data.data;

      if (!key) {
        throw new Error('Razorpay public key was not returned by the server. Please check backend configuration.');
      }

      // 3. Load Razorpay Checkout Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection and try again.');
      }

      // 4. Open Real Razorpay Checkout Modal
      const options = {
        key: key,
        amount: Math.round(paymentData.amount * 100),
        currency: paymentData.currency || 'INR',
        name: 'Deals on Wheels',
        description: `Vehicle Purchase: ${vehicle.title}`,
        order_id: order_id || paymentData.gatewayOrderId,
        handler: async function (response) {
          setVerifying(true);
          setError('');
          try {
            // 5. Verify cryptographic signature & payment status on backend
            const verifyRes = await api.post('/payments/verify', {
              gatewayOrderId: response.razorpay_order_id,
              gatewayPaymentId: response.razorpay_payment_id,
              gatewaySignature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              setPurchaseSuccess(true);
            } else {
              throw new Error(verifyRes.data.message || 'Payment verification failed on the server.');
            }
          } catch (err) {
            setError(err.response?.data?.message || err.message || 'Payment verification failed on the server.');
          } finally {
            setVerifying(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        notes: {
          orderId: orderData._id,
          vehicleId: vehicle._id
        },
        theme: {
          color: '#2563EB'
        },
        modal: {
          ondismiss: function () {
            setError('Payment was cancelled or dismissed. You can retry while your vehicle reservation is active.');
            setPurchasing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error?.description || 'Payment failed. Please try again with a valid test card or payment method.');
        setPurchasing(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete checkout. This vehicle may no longer be available.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading order summary..." />;

  if (purchaseSuccess) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
        <DashboardSidebar role="buyer" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-xl text-center max-w-lg w-full space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Purchase Confirmed!</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Congratulations! Your purchase order for <span className="font-bold text-gray-900">{vehicle?.title}</span> has been confirmed. Notifications have been issued to you and the seller.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Button variant="primary" size="md" onClick={() => navigate('/my-purchases')}>
                View My Orders
              </Button>
              <Button variant="outline" size="md" onClick={() => navigate('/browse')}>
                Continue Browsing
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
        <DashboardSidebar role="buyer" />
        <main className="flex-1 p-8">
          <ErrorMessage message={error} onRetry={() => navigate('/browse')} />
        </main>
      </div>
    );
  }

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel and Back
        </button>

        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" /> Confirm Vehicle Purchase
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review the vehicle summary and seller information before placing your order</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Vehicle & Seller Summary */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Vehicle Details</h3>
              <div className="flex items-start gap-4">
                <img
                  src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                  alt={vehicle.title}
                  className="w-28 h-20 object-cover rounded-xl border border-gray-200"
                />
                <div className="space-y-1">
                  <Badge variant="blue">{vehicle.vehicleType}</Badge>
                  <h4 className="text-base font-bold text-gray-900">{vehicle.title}</h4>
                  <p className="text-xs text-gray-500">{vehicle.brand} • {vehicle.model} • {vehicle.year} • {vehicle.fuelType}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {vehicle.city}, {vehicle.state}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Seller Details</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center">
                  {vehicle.sellerId?.name ? vehicle.sellerId.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{vehicle.sellerId?.name}</h4>
                  <p className="text-xs text-gray-500">{vehicle.sellerId?.city}, {vehicle.sellerId?.state}</p>
                </div>
              </div>
            </div>

            {/* Buyer Info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Buyer Contact Information</h3>
              <div className="text-sm space-y-1 text-gray-700">
                <p><span className="font-semibold text-gray-900">Name:</span> {user?.name}</p>
                <p><span className="font-semibold text-gray-900">Email:</span> {user?.email}</p>
                <p><span className="font-semibold text-gray-900">Phone:</span> {user?.phone}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Price & Order Action Box */}
          <div className="md:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md space-y-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Vehicle Listing Price</span>
                  <span>{formatPrice(vehicle.price)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Marketplace Processing Fee</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-extrabold text-gray-900">
                  <span>Total Amount Payable</span>
                  <span className="text-blue-600 text-xl">{formatPrice(vehicle.price)}</span>
                </div>
              </div>

              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Payments are processed securely via Razorpay. Your vehicle reservation is secured for 10 minutes once checkout begins.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full py-3.5 text-base shadow-md"
                onClick={handleInitiateOrder}
                isLoading={purchasing || verifying}
                icon={CreditCard}
              >
                {verifying ? 'Verifying Payment...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfirmPurchase;
