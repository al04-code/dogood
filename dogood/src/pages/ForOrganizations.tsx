import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface OrganizationOpportunity {
  id: string;
  title: string;
  description: string;
  city: string;
  date: string;
  time: string;
  hours_needed: number;
  cause_category: string;
  max_volunteers: number;
  current_volunteers: number;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
}

const ForOrganizations: React.FC = () => {
  const { supabase } = useSupabase();
  const { user, userProfile } = useAuth();
  
  const [opportunities, setOpportunities] = useState<OrganizationOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<OrganizationOpportunity | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cause_category: 'STEM',
    hours_needed: 2,
    max_volunteers: 10,
    date: '',
    time: '',
    city: '',
    state: 'TX',
    zip_code: '',
    requirements: ''
  });

  const categories = ['STEM', 'Environment', 'Health', 'Education', 'Other'];
  const states = ['TX', 'OK', 'AR', 'LA'];

  useEffect(() => {
    if (user && userProfile?.user_type === 'organization') {
      fetchOrganizationOpportunities();
    }
  }, [user, userProfile]);

  const fetchOrganizationOpportunities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching opportunities:', error);
        return;
      }

      setOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || userProfile?.user_type !== 'organization') {
      alert('Only organizations can post opportunities.');
      return;
    }

    if (!userProfile?.verified) {
      alert('Your organization must be verified before posting opportunities. Please wait for verification or contact support.');
      return;
    }

    try {
      const opportunityData = {
        ...formData,
        organization_id: user.id,
        status: 'active',
        current_volunteers: 0,
        created_at: new Date().toISOString()
      };

      if (editingOpportunity) {
        // Update existing opportunity
        const { error } = await supabase
          .from('opportunities')
          .update(opportunityData)
          .eq('id', editingOpportunity.id);

        if (error) throw error;
      } else {
        // Create new opportunity
        const { error } = await supabase
          .from('opportunities')
          .insert([opportunityData]);

        if (error) throw error;
      }

      // Reset form and refresh opportunities
      setFormData({
        title: '',
        description: '',
        cause_category: 'STEM',
        hours_needed: 2,
        max_volunteers: 10,
        date: '',
        time: '',
        city: '',
        state: 'TX',
        zip_code: '',
        requirements: ''
      });
      setShowForm(false);
      setEditingOpportunity(null);
      fetchOrganizationOpportunities();
    } catch (error) {
      console.error('Error saving opportunity:', error);
      alert('Failed to save opportunity. Please try again.');
    }
  };

  const handleEdit = (opportunity: OrganizationOpportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description,
      cause_category: opportunity.cause_category,
      hours_needed: opportunity.hours_needed,
      max_volunteers: opportunity.max_volunteers,
      date: opportunity.date,
      time: opportunity.time,
      city: opportunity.city,
      state: 'TX', // Default value
      zip_code: '',
      requirements: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (opportunityId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;

      fetchOrganizationOpportunities();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('Failed to delete opportunity. Please try again.');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingOpportunity(null);
    setFormData({
      title: '',
      description: '',
      cause_category: 'STEM',
      hours_needed: 2,
      max_volunteers: 10,
      date: '',
      time: '',
      city: '',
      state: 'TX',
      zip_code: '',
      requirements: ''
    });
  };

  const getCategoryClass = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'STEM': 'category-stem',
      'Environment': 'category-environment',
      'Health': 'category-health',
      'Education': 'category-education',
      'Other': 'category-other'
    };
    return categoryMap[category] || 'category-other';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; class: string } } = {
      'active': { text: 'Active', class: 'bg-green-100 text-green-800' },
      'inactive': { text: 'Inactive', class: 'bg-gray-100 text-gray-800' },
      'completed': { text: 'Completed', class: 'bg-blue-100 text-blue-800' }
    };
    
    const statusInfo = statusMap[status] || statusMap['active'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  // If user is not an organization, show info page
  if (!user || userProfile?.user_type !== 'organization') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-dogood-secondary rounded-lg flex items-center justify-center mb-6">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            For Organizations
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with high school students and post meaningful volunteer opportunities
          </p>
          
          {!user ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Join DoGood to post volunteer opportunities and connect with students in your community.
              </p>
              <div className="flex justify-center space-x-4">
                <a href="/register/organization" className="btn-secondary">
                  Register Your Organization
                </a>
                <a href="/login" className="btn-outline">
                  Sign In
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Student Account Detected
              </h3>
              <p className="text-blue-700">
                You're currently signed in with a student account. To post opportunities, 
                you'll need to register your organization with a separate account.
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-dogood-primary/10 p-4 rounded-lg mb-4">
              <Users className="h-8 w-8 text-dogood-primary mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reach Students</h3>
            <p className="text-gray-600">
              Connect with motivated high school students in the Dallas-Fort Worth area
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-dogood-secondary/10 p-4 rounded-lg mb-4">
              <Plus className="h-8 w-8 text-dogood-secondary mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Posting</h3>
            <p className="text-gray-600">
              Simple forms to create and manage volunteer opportunities
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-dogood-accent/10 p-4 rounded-lg mb-4">
              <CheckCircle className="h-8 w-8 text-dogood-accent mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Status</h3>
            <p className="text-gray-600">
              Build trust with verification badges and student reviews
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Organization Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your volunteer opportunities and connect with students
        </p>
      </div>

      {/* Verification Status */}
      {!userProfile?.verified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-yellow-900 mb-1">
                Verification Pending
              </h3>
              <p className="text-yellow-700">
                Your organization is currently under review. You'll be able to post opportunities once verified. 
                This process typically takes 1-2 business days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Opportunities ({opportunities.length})
        </h2>
        
        {userProfile?.verified && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-secondary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Opportunity
          </button>
        )}
      </div>

      {/* Opportunity Form */}
      {showForm && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingOpportunity ? 'Edit Opportunity' : 'Post New Opportunity'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Help with Science Fair Setup"
                />
              </div>
              
              <div>
                <label className="form-label">Category *</label>
                <select
                  name="cause_category"
                  value={formData.cause_category}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="form-label">Hours Needed *</label>
                <input
                  type="number"
                  name="hours_needed"
                  value={formData.hours_needed}
                  onChange={handleInputChange}
                  min="1"
                  max="24"
                  required
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="form-label">Max Volunteers *</label>
                <input
                  type="number"
                  name="max_volunteers"
                  value={formData.max_volunteers}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  required
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="form-label">Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="form-label">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Dallas"
                />
              </div>
              
              <div>
                <label className="form-label">State *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="input-field"
                placeholder="Describe the volunteer opportunity, what students will be doing, and any important details..."
              />
            </div>
            
            <div>
              <label className="form-label">Requirements (Optional)</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Any specific requirements, skills, or age restrictions..."
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={cancelForm}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-secondary"
              >
                {editingOpportunity ? 'Update Opportunity' : 'Post Opportunity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Opportunities List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading-spinner"></div>
          <span className="ml-3 text-gray-600">Loading opportunities...</span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12">
          <Plus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
          <p className="text-gray-600 mb-4">
            {userProfile?.verified 
              ? 'Start by posting your first volunteer opportunity.'
              : 'You\'ll be able to post opportunities once your organization is verified.'
            }
          </p>
          {userProfile?.verified && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-secondary"
            >
              Post Your First Opportunity
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`category-badge ${getCategoryClass(opportunity.cause_category)}`}>
                      {opportunity.cause_category}
                    </span>
                    {getStatusBadge(opportunity.status)}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {opportunity.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {opportunity.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{formatDate(opportunity.date)} at {opportunity.time}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{opportunity.city}</span>
                    </div>
                    <div className="flex items-center">
                      <span>{opportunity.hours_needed} hours needed</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{opportunity.current_volunteers}/{opportunity.max_volunteers} volunteers</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Posted {formatDate(opportunity.created_at)}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(opportunity)}
                      className="btn-outline text-sm px-3 py-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(opportunity.id)}
                      className="text-red-600 hover:text-red-700 text-sm px-3 py-1 border border-red-600 hover:border-red-700 rounded transition-colors duration-200"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForOrganizations;
