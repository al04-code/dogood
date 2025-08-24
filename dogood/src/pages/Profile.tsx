import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { 
  User, 
  Mail, 
  Target, 
  Clock, 
  Building, 
  MapPin, 
  Phone, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, userProfile, updateProfile } = useAuth();
  const { supabase } = useSupabase();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    service_hours_goal: 100,
    organization_name: '',
    address: '',
    city: '',
    state: 'TX',
    zip_code: '',
    phone: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        service_hours_goal: userProfile.service_hours_goal || 100,
        organization_name: userProfile.organization_name || '',
        address: '',
        city: '',
        state: 'TX',
        zip_code: '',
        phone: ''
      });
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updates: any = {};
      
      if (userProfile?.user_type === 'student') {
        updates.full_name = formData.full_name;
        updates.service_hours_goal = parseInt(formData.service_hours_goal.toString());
      } else if (userProfile?.user_type === 'organization') {
        updates.full_name = formData.full_name;
        updates.organization_name = formData.organization_name;
        updates.address = formData.address;
        updates.city = formData.city;
        updates.state = formData.state;
        updates.zip_code = formData.zip_code;
        updates.phone = formData.phone;
      }

      const { error } = await updateProfile(updates);
      
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setMessage(null);
    // Reset form data to original values
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        service_hours_goal: userProfile.service_hours_goal || 100,
        organization_name: userProfile.organization_name || '',
        address: '',
        city: '',
        state: 'TX',
        zip_code: '',
        phone: ''
      });
    }
  };

  const getVerificationStatus = () => {
    if (userProfile?.user_type === 'organization') {
      if (userProfile.verified) {
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Verified Organization</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center text-yellow-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Verification Pending</span>
          </div>
        );
      }
    }
    return null;
  };

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile
        </h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-outline flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">
                      {userProfile.user_type === 'organization' ? 'Contact Person' : 'Full Name'} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        required
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="input-field pl-10 bg-gray-50"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  {userProfile.user_type === 'organization' && (
                    <>
                      <div>
                        <label className="form-label">Organization Name *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="organization_name"
                            value={formData.organization_name}
                            onChange={handleInputChange}
                            required
                            className="input-field pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Phone Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="input-field pl-10"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Street Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="input-field pl-10"
                            placeholder="123 Main Street"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="Dallas"
                          />
                        </div>
                        <div>
                          <label className="form-label">State</label>
                          <select
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="input-field"
                          >
                            <option value="TX">TX</option>
                            <option value="OK">OK</option>
                            <option value="AR">AR</option>
                            <option value="LA">LA</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">ZIP Code</label>
                          <input
                            type="text"
                            name="zip_code"
                            value={formData.zip_code}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="75201"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {userProfile.user_type === 'student' && (
                    <div>
                      <label className="form-label">Service Hours Goal</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Target className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="service_hours_goal"
                          value={formData.service_hours_goal}
                          onChange={handleInputChange}
                          min="1"
                          max="1000"
                          className="input-field pl-10"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Set your goal for volunteer service hours
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="loading-spinner mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{userProfile.full_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{user?.email}</p>
                  </div>

                  {userProfile.user_type === 'organization' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Organization</label>
                        <p className="text-gray-900">{userProfile.organization_name}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{formData.phone || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-gray-900">
                          {formData.address && formData.city && formData.state 
                            ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip_code}`
                            : 'Not provided'
                          }
                        </p>
                      </div>
                    </>
                  )}

                  {userProfile.user_type === 'student' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service Hours Goal</label>
                      <p className="text-gray-900">{userProfile.service_hours_goal || 100} hours</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Type & Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Type</label>
                <div className="flex items-center mt-1">
                  {userProfile.user_type === 'organization' ? (
                    <Building className="h-5 w-5 text-dogood-secondary mr-2" />
                  ) : (
                    <User className="h-5 w-5 text-dogood-primary mr-2" />
                  )}
                  <span className="text-gray-900 capitalize">
                    {userProfile.user_type}
                  </span>
                </div>
              </div>
              
              {getVerificationStatus()}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Service Hours Progress (Students Only) */}
          {userProfile.user_type === 'student' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Hours Progress</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hours Completed</span>
                  <span className="font-medium text-gray-900">
                    {userProfile.total_hours_logged || 0} hours
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="progress-bar rounded-full"
                    style={{ 
                      width: `${Math.min(
                        ((userProfile.total_hours_logged || 0) / (userProfile.service_hours_goal || 100)) * 100, 100
                      )}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Goal</span>
                  <span className="font-medium text-gray-900">
                    {userProfile.service_hours_goal || 100} hours
                  </span>
                </div>
                
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    {userProfile.total_hours_logged && userProfile.service_hours_goal
                      ? `${Math.round(((userProfile.total_hours_logged / userProfile.service_hours_goal) * 100))}% complete`
                      : '0% complete'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {userProfile.user_type === 'student' ? (
                <a
                  href="/my-opportunities"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  View My Opportunities
                </a>
              ) : (
                <a
                  href="/for-organizations"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  Manage Opportunities
                </a>
              )}
              
              <a
                href="/opportunities"
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Browse Opportunities
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
