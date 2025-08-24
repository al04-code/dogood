import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  CheckCircle, 
  Clock, 
  Target, 
  MapPin, 
  Building,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface SavedOpportunity {
  id: string;
  opportunity_id: string;
  saved_at: string;
  opportunity: {
    id: string;
    title: string;
    organization_name: string;
    organization_verified: boolean;
    city: string;
    date: string;
    time: string;
    hours_needed: number;
    cause_category: string;
  };
}

interface RegisteredOpportunity {
  id: string;
  opportunity_id: string;
  registered_at: string;
  status: 'registered' | 'completed' | 'cancelled';
  hours_completed?: number;
  opportunity: {
    id: string;
    title: string;
    organization_name: string;
    organization_verified: boolean;
    city: string;
    date: string;
    time: string;
    hours_needed: number;
    cause_category: string;
  };
}

const MyOpportunities: React.FC = () => {
  const { supabase } = useSupabase();
  const { user, userProfile } = useAuth();
  
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [registeredOpportunities, setRegisteredOpportunities] = useState<RegisteredOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'registered'>('saved');
  const [editingHours, setEditingHours] = useState<string | null>(null);
  const [hoursInput, setHoursInput] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserOpportunities();
    }
  }, [user]);

  const fetchUserOpportunities = async () => {
    try {
      setLoading(true);
      
      // Fetch saved opportunities
      const { data: savedData, error: savedError } = await supabase
        .from('saved_opportunities')
        .select(`
          *,
          opportunity:opportunities (
            id,
            title,
            organization_name,
            organization_verified,
            city,
            date,
            time,
            hours_needed,
            cause_category
          )
        `)
        .eq('user_id', user?.id)
        .order('saved_at', { ascending: false });

      if (savedError) {
        console.error('Error fetching saved opportunities:', savedError);
      } else {
        setSavedOpportunities(savedData || []);
      }

      // Fetch registered opportunities
      const { data: registeredData, error: registeredError } = await supabase
        .from('volunteer_registrations')
        .select(`
          *,
          opportunity:opportunities (
            id,
            title,
            organization_name,
            organization_verified,
            city,
            date,
            time,
            hours_needed,
            cause_category
          )
        `)
        .eq('user_id', user?.id)
        .order('registered_at', { ascending: false });

      if (registeredError) {
        console.error('Error fetching registered opportunities:', registeredError);
      } else {
        setRegisteredOpportunities(registeredData || []);
      }
    } catch (error) {
      console.error('Error fetching user opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSavedOpportunity = async (savedId: string) => {
    try {
      await supabase
        .from('saved_opportunities')
        .delete()
        .eq('id', savedId);
      
      setSavedOpportunities(prev => prev.filter(item => item.id !== savedId));
    } catch (error) {
      console.error('Error removing saved opportunity:', error);
    }
  };

  const updateHoursCompleted = async (registrationId: string, hours: number) => {
    try {
      const { error } = await supabase
        .from('volunteer_registrations')
        .update({ 
          hours_completed: hours,
          status: hours > 0 ? 'completed' : 'registered'
        })
        .eq('id', registrationId);

      if (error) throw error;

      // Update local state
      setRegisteredOpportunities(prev => 
        prev.map(item => 
          item.id === registrationId 
            ? { ...item, hours_completed: hours, status: hours > 0 ? 'completed' : 'registered' }
            : item
        )
      );

      // Update total hours in user profile
      if (userProfile) {
        const totalHours = registeredOpportunities.reduce((sum, item) => 
          sum + (item.hours_completed || 0), 0) + hours;
        
        await supabase
          .from('profiles')
          .update({ total_hours_logged: totalHours })
          .eq('id', userProfile.id);
      }

      setEditingHours(null);
      setHoursInput('');
    } catch (error) {
      console.error('Error updating hours:', error);
      alert('Failed to update hours. Please try again.');
    }
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
      'registered': { text: 'Registered', class: 'bg-blue-100 text-blue-800' },
      'completed': { text: 'Completed', class: 'bg-green-100 text-green-800' },
      'cancelled': { text: 'Cancelled', class: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status] || statusMap['registered'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Loading your opportunities...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Opportunities
        </h1>
        <p className="text-gray-600">
          Track your saved opportunities, registrations, and service hours progress
        </p>
      </div>

      {/* Progress Overview */}
      {userProfile && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Service Hours Progress</h2>
            <Target className="h-6 w-6 text-dogood-primary" />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Hours Completed</span>
              <span className="font-medium text-gray-900">
                {registeredOpportunities.reduce((sum, item) => sum + (item.hours_completed || 0), 0)} hours
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="progress-bar rounded-full"
                style={{ 
                  width: `${Math.min(
                    (registeredOpportunities.reduce((sum, item) => sum + (item.hours_completed || 0), 0) / 
                    (userProfile.service_hours_goal || 100)) * 100, 100
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
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'saved'
                ? 'border-dogood-primary text-dogood-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Saved Opportunities ({savedOpportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('registered')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'registered'
                ? 'border-dogood-primary text-dogood-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Registrations ({registeredOpportunities.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'saved' ? (
        <div>
          {savedOpportunities.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved opportunities</h3>
              <p className="text-gray-600 mb-4">
                Save opportunities you're interested in to view them here later.
              </p>
              <Link to="/opportunities" className="btn-primary">
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="opportunities-grid">
              {savedOpportunities.map((saved) => (
                <div key={saved.id} className="card opportunity-card">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`category-badge ${getCategoryClass(saved.opportunity.cause_category)}`}>
                      {saved.opportunity.cause_category}
                    </span>
                    <button
                      onClick={() => removeSavedOpportunity(saved.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {saved.opportunity.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      <span className="font-medium">{saved.opportunity.organization_name}</span>
                      {saved.opportunity.organization_verified && (
                        <span className="ml-2 verified-badge">✓</span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{saved.opportunity.city}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{formatDate(saved.opportunity.date)} at {saved.opportunity.time}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <span>{saved.opportunity.hours_needed} hours needed</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Saved {formatDate(saved.saved_at)}
                    </span>
                    <Link
                      to={`/opportunities/${saved.opportunity.id}`}
                      className="btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {registeredOpportunities.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations yet</h3>
              <p className="text-gray-600 mb-4">
                Register for volunteer opportunities to track them here.
              </p>
              <Link to="/opportunities" className="btn-primary">
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registeredOpportunities.map((registration) => (
                <div key={registration.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`category-badge ${getCategoryClass(registration.opportunity.cause_category)}`}>
                          {registration.opportunity.cause_category}
                        </span>
                        {getStatusBadge(registration.status)}
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {registration.opportunity.title}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          <span>{registration.opportunity.organization_name}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{registration.opportunity.city}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatDate(registration.opportunity.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          Hours completed: {registration.hours_completed || 0}
                        </span>
                        <span className="text-sm text-gray-600">
                          Hours needed: {registration.opportunity.hours_needed}
                        </span>
                      </div>
                      
                      {registration.status === 'registered' && (
                        <div className="flex items-center space-x-2">
                          {editingHours === registration.id ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                max={registration.opportunity.hours_needed}
                                value={hoursInput}
                                onChange={(e) => setHoursInput(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Hours"
                              />
                              <button
                                onClick={() => updateHoursCompleted(registration.id, parseInt(hoursInput) || 0)}
                                className="btn-primary text-sm px-3 py-1"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingHours(null);
                                  setHoursInput('');
                                }}
                                className="text-gray-500 hover:text-gray-700 text-sm"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingHours(registration.id);
                                setHoursInput(registration.hours_completed?.toString() || '');
                              }}
                              className="btn-outline text-sm px-3 py-1"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Log Hours
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyOpportunities;
