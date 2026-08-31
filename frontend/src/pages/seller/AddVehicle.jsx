import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';
import { Car, Plus, Trash2, Upload, CheckCircle, Image as ImageIcon } from 'lucide-react';

const AddVehicle = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    model: '',
    variant: '',
    year: new Date().getFullYear(),
    price: '',
    vehicleType: 'Car',
    fuelType: 'Petrol',
    transmission: 'Manual',
    kilometersDriven: '',
    condition: 'Used',
    description: '',
    city: '',
    state: '',
    registrationNumber: '',
    categoryId: '',
    vinNumber: ''
  });

  const [categories, setCategories] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [rcFile, setRcFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [pucFile, setPucFile] = useState(null);
  const [additionalFile, setAdditionalFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch categories on mount
  React.useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/vehicles/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCats();
  }, []);

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
      const filesArr = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArr]);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.title || !formData.brand || !formData.model || !formData.price || !formData.city || !formData.state || !formData.description || !formData.registrationNumber) {
      setError('Please fill in all required fields (including Registration Number).');
      return;
    }

    if (Number(formData.price) <= 0) {
      setError('Price must be a positive number.');
      return;
    }

    if (Number(formData.kilometersDriven) < 0) {
      setError('Kilometers driven cannot be negative.');
      return;
    }

    const currentYear = new Date().getFullYear();
    if (Number(formData.year) < 1900 || Number(formData.year) > currentYear + 1) {
      setError(`Year must be between 1900 and ${currentYear + 1}.`);
      return;
    }

    if (imageUrls.length === 0 && selectedFiles.length === 0) {
      setError('At least one vehicle image is required (via upload or image URL).');
      return;
    }

    if (!rcFile || !insuranceFile || !pucFile) {
      setError('Please upload all required verification documents (RC, Insurance, and PUC).');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      // Append file uploads
      selectedFiles.forEach((file) => {
        submitData.append('images', file);
      });

      // If imageUrls exist, send as JSON string
      if (imageUrls.length > 0) {
        submitData.append('images', JSON.stringify(imageUrls));
      }

      // Append verification documents
      if (rcFile) submitData.append('rcDocument', rcFile);
      if (insuranceFile) submitData.append('insuranceDocument', insuranceFile);
      if (pucFile) submitData.append('pucDocument', pucFile);
      if (additionalFile) submitData.append('additionalDocument', additionalFile);

      const res = await api.post('/vehicles', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setSuccess('Vehicle listed successfully! Redirecting to My Vehicles...');
        setTimeout(() => {
          navigate('/seller/vehicles');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create vehicle listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="seller" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600" /> List a New Vehicle
          </h1>
          <p className="text-sm text-gray-500 mt-1">Provide clear specifications and photos to attract potential buyers</p>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Basic Information */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">1. Basic Information</h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Vehicle Listing Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. 2022 Hyundai Creta SX (O) Turbo Petrol"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Brand *</label>
                <input
                  type="text"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Hyundai"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Model *</label>
                <input
                  type="text"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. Creta"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Variant</label>
                <input
                  type="text"
                  name="variant"
                  value={formData.variant}
                  onChange={handleChange}
                  placeholder="e.g. SX (O) Turbo"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Year *</label>
                <input
                  type="number"
                  name="year"
                  required
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Vehicle Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">2. Vehicle Specifications</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Vehicle Type *</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Car">Car</option>
                  <option value="SUV">SUV</option>
                  <option value="Bike">Bike</option>
                  <option value="Electric Vehicle">Electric Vehicle</option>
                  <option value="Commercial Vehicle">Commercial Vehicle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Fuel Type *</label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="CNG">CNG</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Transmission *</label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Kilometers Driven *</label>
                <input
                  type="number"
                  name="kilometersDriven"
                  required
                  value={formData.kilometersDriven}
                  onChange={handleChange}
                  placeholder="e.g. 18500"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Condition *</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Used">Used</option>
                  <option value="New">New</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Pricing & Location */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">3. Pricing & Location</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 1450000"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Description */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">4. Detailed Description</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Vehicle Description *</label>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe vehicle condition, features, service history, and reason for selling..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* SECTION 5: Images Upload / URLs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" /> 5. Vehicle Images *
            </h3>

            {/* Upload File Input */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-gray-50">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label className="block text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                Upload Image Files
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB each</p>
            </div>

            {/* Selected File Previews */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-600">Selected Upload Files ({selectedFiles.length}):</span>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 text-xs text-blue-900 font-medium">
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button type="button" onClick={() => handleRemoveFile(idx)} className="text-rose-600 hover:text-rose-800">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image URL Input Alternative */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Or Add Image URLs</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/vehicle-image.jpg"
                  className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
                <Button type="button" variant="outline" size="md" onClick={handleAddImageUrl}>
                  Add URL
                </Button>
              </div>

              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-800">
                      <span className="truncate max-w-[200px]">{url}</span>
                      <button type="button" onClick={() => handleRemoveImageUrl(idx)} className="text-rose-600 hover:text-rose-800">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6: Verification Documents */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" /> 6. Verification Documents & Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">VIN / Chassis Number</label>
              <input
                type="text"
                name="vinNumber"
                value={formData.vinNumber}
                onChange={handleChange}
                placeholder="Enter 17-character VIN/Chassis number"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Registration Certificate (RC) *</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  required
                  onChange={(e) => setRcFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {rcFile && <p className="text-[10px] text-emerald-600 mt-1">✓ {rcFile.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Insurance Certificate *</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  required
                  onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {insuranceFile && <p className="text-[10px] text-emerald-600 mt-1">✓ {insuranceFile.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">PUC Certificate *</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  required
                  onChange={(e) => setPucFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {pucFile && <p className="text-[10px] text-emerald-600 mt-1">✓ {pucFile.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Additional Supporting Document (Optional)</label>
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
              Publish Vehicle Listing
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddVehicle;
