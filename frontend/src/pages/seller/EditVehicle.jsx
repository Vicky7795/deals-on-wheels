import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { Edit3, CheckCircle, Upload, Trash2 } from 'lucide-react';

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [categories, setCategories] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [rcFile, setRcFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [pucFile, setPucFile] = useState(null);
  const [additionalFile, setAdditionalFile] = useState(null);

  useEffect(() => {
    const fetchCatsAndVehicle = async () => {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        setError('Invalid Vehicle ID.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch Categories
        const catRes = await api.get('/vehicles/categories');
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }

        // Fetch Vehicle details
        const res = await api.get(`/vehicles/${id}`);
        if (res.data.success) {
          const veh = res.data.data;
          setFormData({
            title: veh.title || '',
            brand: veh.brand || '',
            model: veh.model || '',
            variant: veh.variant || '',
            year: veh.year || new Date().getFullYear(),
            price: veh.price || '',
            vehicleType: veh.vehicleType || 'Car',
            fuelType: veh.fuelType || 'Petrol',
            transmission: veh.transmission || 'Manual',
            kilometersDriven: veh.kilometersDriven || '',
            condition: veh.condition || 'Used',
            description: veh.description || '',
            city: veh.city || '',
            state: veh.state || '',
            status: veh.status || 'available',
            registrationNumber: veh.registrationNumber || '',
            categoryId: veh.categoryId || '',
            vinNumber: veh.vinNumber || ''
          });
          setImageUrls(veh.images || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load vehicle details for editing.');
      } finally {
        setLoading(false);
      }
    };
    fetchCatsAndVehicle();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImageUrls([...imageUrls, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImageUrl = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Number(formData.price) <= 0) {
      setError('Price must be a positive number.');
      return;
    }

    if (Number(formData.kilometersDriven) < 0) {
      setError('Kilometers driven cannot be negative.');
      return;
    }

    if (!formData.registrationNumber) {
      setError('Registration number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      selectedFiles.forEach((file) => {
        submitData.append('images', file);
      });

      if (imageUrls.length > 0) {
        submitData.append('images', JSON.stringify(imageUrls));
      }

      // Append verification documents
      if (rcFile) submitData.append('rcDocument', rcFile);
      if (insuranceFile) submitData.append('insuranceDocument', insuranceFile);
      if (pucFile) submitData.append('pucDocument', pucFile);
      if (additionalFile) submitData.append('additionalDocument', additionalFile);

      const res = await api.put(`/vehicles/${id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setSuccess('Vehicle updated successfully! Redirecting...');
        setTimeout(() => {
          navigate('/seller/vehicles');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading vehicle for editing..." />;
  if (error && !formData) return <ErrorMessage message={error} onRetry={() => navigate('/seller/vehicles')} />;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="seller" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-amber-600" /> Edit Vehicle Listing
          </h1>
          <p className="text-sm text-gray-500 mt-1">Update details, price, images, or availability status</p>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> {success}
          </div>
        )}

        {formData && (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Basic Info & Availability</h3>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Listing Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Kilometers Driven</label>
                  <input
                    type="number"
                    name="kilometersDriven"
                    value={formData.kilometersDriven}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category *</label>
                  <select
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. MH-01-AB-1234"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Description</h3>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Images</h3>

              {imageUrls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-600">Current Image URLs ({imageUrls.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
                        <span className="truncate max-w-[200px]">{url}</span>
                        <button type="button" onClick={() => handleRemoveImageUrl(idx)} className="text-rose-600 hover:text-rose-800">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Add additional image URL..."
                  className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
                <Button type="button" variant="outline" size="md" onClick={handleAddImageUrl}>
                  Add URL
                </Button>
              </div>
            </div>

            {/* Verification Documents & Details */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" /> Verification Documents & Details
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">VIN / Chassis Number</label>
                <input
                  type="text"
                  name="vinNumber"
                  value={formData.vinNumber}
                  onChange={handleChange}
                  placeholder="Enter 17-character VIN/Chassis number"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Registration Certificate (RC) <span className="text-gray-400 font-normal">(Leave empty to keep existing)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setRcFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {rcFile && <p className="text-[10px] text-emerald-600 mt-1">✓ {rcFile.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Insurance Certificate <span className="text-gray-400 font-normal">(Leave empty to keep existing)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {insuranceFile && <p className="text-[10px] text-emerald-600 mt-1">✓ {insuranceFile.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    PUC Certificate <span className="text-gray-400 font-normal">(Leave empty to keep existing)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setPucFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {pucFile && <p className="text-[10px] text-emerald-600 mt-1">✓ {pucFile.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Additional Supporting Document <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setAdditionalFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {additionalFile && <p className="text-[10px] text-emerald-600 mt-1">✓ {additionalFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" size="lg" onClick={() => navigate('/seller/vehicles')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="lg" className="px-8 shadow-md" isLoading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default EditVehicle;
