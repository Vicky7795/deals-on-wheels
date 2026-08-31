import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ImageGallery from '../../components/vehicle/ImageGallery';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ReportModal from '../../components/common/ReportModal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Gauge,
  Fuel,
  MapPin,
  Heart,
  MessageSquare,
  ShoppingBag,
  User,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inquiry modal state
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState('');

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const fetchVehicleDetails = async () => {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      setError('Invalid Vehicle ID. Please select a valid vehicle listing from the marketplace.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/vehicles/${id}`);
      if (res.data.success) {
        setVehicle(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vehicle details.');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (isAuthenticated && (role === 'buyer' || role === 'user')) {
      try {
        const res = await api.get('/favorites');
        if (res.data.success) {
          const found = (res.data.data || []).some(fav => fav.vehicleId && fav.vehicleId._id === id);
          setIsFavorite(found);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [id, isAuthenticated, role]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (role !== 'buyer' && role !== 'user') {
      alert('Only Buyer accounts can save favorite vehicles.');
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/favorites/${id}`);
        setIsFavorite(false);
      } else {
        await api.post(`/favorites/${id}`);
        setIsFavorite(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update favorite status.');
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;

    setSendingInquiry(true);
    setInquirySuccess('');
    try {
      const res = await api.post('/inquiries', {
        vehicleId: id,
        message: inquiryMessage.trim()
      });
      if (res.data.success) {
        setInquirySuccess('Your inquiry has been sent successfully to the seller!');
        setInquiryMessage('');
        setTimeout(() => {
          setIsInquiryOpen(false);
          setInquirySuccess('');
        }, 2000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send inquiry.');
    } finally {
      setSendingInquiry(false);
    }
  };

  const handleBuyClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (role !== 'buyer' && role !== 'user') {
      alert('Only buyers can purchase vehicles.');
      return;
    }
    navigate(`/buyer/checkout/${id}`);
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading vehicle details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchVehicleDetails} />;
  if (!vehicle) return null;

  const isSold = vehicle.status !== 'available';
  const isOwner = user && vehicle.sellerId && user._id === vehicle.sellerId._id;

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-7 space-y-8">
          <ImageGallery images={vehicle.images} />

          {/* Detailed Specifications */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Vehicle Overview & Specs
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 font-medium block">Year</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-blue-600" /> {vehicle.year}
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 font-medium block">Kilometers Driven</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                  <Gauge className="w-4 h-4 text-blue-600" /> {vehicle.kilometersDriven.toLocaleString('en-IN')} km
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 font-medium block">Fuel Type</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                  <Fuel className="w-4 h-4 text-blue-600" /> {vehicle.fuelType}
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 font-medium block">Transmission</span>
                <span className="text-base font-bold text-gray-900 mt-0.5 block">{vehicle.transmission}</span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 font-medium block">Condition</span>
                <span className="text-base font-bold text-gray-900 mt-0.5 block">{vehicle.condition}</span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 font-medium block">Location</span>
                <span className="text-base font-bold text-gray-900 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" /> {vehicle.city}, {vehicle.state}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Seller's Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
                {vehicle.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Price, Action Panel & Seller Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 sticky top-24">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="blue">{vehicle.vehicleType}</Badge>
                <Badge variant={vehicle.status === 'available' ? 'green' : vehicle.status === 'reserved' ? 'warning' : 'danger'}>
                  {vehicle.status}
                </Badge>
                {vehicle.variant && <Badge variant="purple">{vehicle.variant}</Badge>}
                {vehicle.approvalStatus === 'approved' && (
                  <Badge
                    variant="success"
                    className="cursor-help border border-emerald-300"
                    title="Seller-submitted vehicle information and documents were reviewed through the Deals on Wheels verification process."
                  >
                    ✓ Verified Listing
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900 leading-snug">{vehicle.title}</h1>
              <p className="text-sm text-gray-500 mt-1">Brand: <span className="font-semibold text-gray-800">{vehicle.brand}</span> | Model: <span className="font-semibold text-gray-800">{vehicle.model}</span></p>
            </div>

            {/* Price Box */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase">Offering Price</span>
                <div className="text-3xl font-black text-gray-900 mt-0.5">{formatPrice(vehicle.price)}</div>
              </div>
              <ShieldCheck className="w-10 h-10 text-blue-600 opacity-80" />
            </div>

            {/* Sold Banner if sold */}
            {isSold ? (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center space-y-1">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-rose-900">Vehicle No Longer Available</h4>
                <p className="text-xs text-rose-700">This vehicle has status "{vehicle.status}" and is no longer available for purchase.</p>
              </div>
            ) : (
              /* Action Buttons */
              <div className="space-y-3 pt-2">
                {!isOwner && (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full text-base py-3.5 shadow-md"
                      onClick={handleBuyClick}
                      icon={ShoppingBag}
                    >
                      Buy Vehicle Now
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="md"
                        className="w-full"
                        onClick={() => {
                          if (!isAuthenticated) navigate('/login');
                          else if (role !== 'buyer' && role !== 'user') alert('Only Buyer accounts can contact sellers.');
                          else setIsInquiryOpen(true);
                        }}
                        icon={MessageSquare}
                      >
                        Contact Seller
                      </Button>

                      <Button
                        variant={isFavorite ? 'danger' : 'outline'}
                        size="md"
                        className="w-full"
                        onClick={handleToggleFavorite}
                        icon={Heart}
                      >
                        {isFavorite ? 'Saved' : 'Favorite'}
                      </Button>
                    </div>
                  </>
                )}

                {isOwner && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-xs font-semibold text-amber-800">You are the seller of this vehicle listing.</p>
                    <Link to={`/seller/vehicles/${id}/edit`}>
                      <Button variant="outline" size="sm" className="mt-2">Edit Listing</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Seller Information Card */}
            {vehicle.sellerId && (
              <div className="border-t border-gray-100 pt-6 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seller Information</h4>
                <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl text-white font-bold flex items-center justify-center text-lg shadow-sm">
                    {vehicle.sellerId.name ? vehicle.sellerId.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-gray-900">{vehicle.sellerId.name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {vehicle.sellerId.city || vehicle.city}, {vehicle.sellerId.state || vehicle.state}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Report Listing Button */}
            {isAuthenticated && !isOwner && (
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Report listing as suspicious
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      <Modal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        title={`Inquire about ${vehicle.title}`}
      >
        {inquirySuccess ? (
          <div className="p-6 text-center text-emerald-600 space-y-2">
            <CheckCircle className="w-12 h-12 mx-auto" />
            <p className="font-semibold text-sm">{inquirySuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSendInquiry} className="space-y-4">
            <p className="text-xs text-gray-500">
              Send a direct inquiry message to seller <span className="font-bold text-gray-800">{vehicle.sellerId?.name}</span>.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Your Message</label>
              <textarea
                rows={4}
                required
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                placeholder="Hi, I am interested in this vehicle. Is it available for a test drive or inspection?"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="md" onClick={() => setIsInquiryOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={sendingInquiry}>
                Send Message
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        vehicleId={id}
        reportedUserId={vehicle.sellerId?._id}
      />
    </div>
  );
};

export default VehicleDetails;
