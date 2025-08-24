import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  MapPin, 
  Clock, 
  Users, 
  Building, 
  Calendar, 
  Heart, 
  Share2, 
  ArrowLeft,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  organization_verified: boolean;
  organization_id: string;
  location: string;
  city: string;
  state: string;
  zip_code: string;
  date: string;
  time: string;
  hours_needed: number;
  cause_category: 'STEM' | 'Environment' | 'Health' | 'Education' | 'Other';
  max_volunteers: number;
  current_volunteers: number;
  requirements: string;
  contact_email: string;
  contact_phone: string;
  latitude?: number;
  longitude?: number;
}

const OpportunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { user, userProfile } = useAuth();
  
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOpportunity();
      checkUserStatus();
    }
  }, [id, user]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          organizations:organization_id (
            name,
            verified,
            contact_email,
            contact_phone
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching opportunity:', error);
        return;
      }

      // Transform data to match our interface
      const transformedData: Opportunity = {
        id: data.id,
        title: data.title,
        description: data.description,
        organization_name: data.organizations?.name || 'Unknown Organization',
        organization_verified: data.organizations?.verified || false,
        organization_id: data.organization_id,
        location: data.location,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        date: data.date,
        time: data.time,
        hours_needed: data.hours_needed,
        cause_category: data.cause_category,
        max_volunteers: data.max_volunteers,
        current_volunteers: data.current_volunteers,
        requirements: data.requirements,
        contact_email: data.organizations?.contact_email || '',
        contact_phone: data.organizations?.contact_phone || '',
        latitude: data.latitude,
        longitude: data.longitude
      };

      setOpportunity(transformedData);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    if (!user) return;

    try {
      // Check if opportunity is saved
      const { data: savedData } = await supabase
        .from('saved_opportunities')
        .select('*')
        .eq('user_id', user.id)
        .eq('opportunity_id', id)
        .single();

      setIsSaved(!!savedData);

      // Check if user is registered for this opportunity
      const { data: registeredData } = await supabase
        .from('volunteer_registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('opportunity_id', id)
        .single();

      setIsRegistered(!!registeredData);
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const toggleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from('saved_opportunities')
          .delete()
          .eq('user_id', user.id)
          .eq('opportunity_id', id);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_opportunities')
          .insert({
            user_id: user.id,
            opportunity_id: id,
            saved_at: new Date().toISOString()
          });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const registerForOpportunity = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (userProfile?.user_type !== 'student') {
      alert('Only students can register for volunteer opportunities.');
      return;
    }

    try {
      const { error } = await supabase
        .from('volunteer_registrations')
        .insert({
          user_id: user.id,
          opportunity_id: id,
          registered_at: new Date().toISOString(),
          status: 'registered'
        });

      if (error) throw error;

      setIsRegistered(true);
      
      // Update current volunteers count
      await supabase
        .from('opportunities')
        .update({ current_volunteers: (opportunity?.current_volunteers || 0) + 1 })
        .eq('id', id);

      if (opportunity) {
        setOpportunity({
          ...opportunity,
          current_volunteers: opportunity.current_volunteers + 1
        });
      }
    } catch (error) {
      console.error('Error registering for opportunity:', error);
      alert('Failed to register for opportunity. Please try again.');
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDirections = () => {
    if (opportunity?.latitude && opportunity?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${opportunity.latitude},${opportunity.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Loading opportunity...</span>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Opportunity not found</h3>
        <p className="text-gray-600">The opportunity you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/opportunities')}
          className="btn-primary mt-4"
        >
          Back to Opportunities
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/opportunities')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Opportunities
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`category-badge ${getCategoryClass(opportunity.cause_category)}`}>
                    {opportunity.cause_category}
                  </span>
                  {opportunity.organization_verified && (
                    <span className="verified-badge">
                      ✓ Verified Organization
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {opportunity.title}
                </h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="font-medium">{opportunity.organization_name}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{opportunity.city}, {opportunity.state}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSave}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isSaved 
                      ? 'text-red-500 bg-red-50' 
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About this opportunity</h2>
            <p className="text-gray-700 leading-relaxed">
              {opportunity.description}
            </p>
          </div>

          {/* Details */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{formatDate(opportunity.date)}</p>
                  <p className="text-sm text-gray-600">at {opportunity.time}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{opportunity.hours_needed} hours</p>
                  <p className="text-sm text-gray-600">time commitment</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{opportunity.current_volunteers}/{opportunity.max_volunteers}</p>
                  <p className="text-sm text-gray-600">volunteers needed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {opportunity.requirements && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <p className="text-gray-700">{opportunity.requirements}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-2">
              {opportunity.contact_email && (
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> {opportunity.contact_email}
                </p>
              )}
              {opportunity.contact_phone && (
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span> {opportunity.contact_phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Involved</h3>
            
            {isRegistered ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-dogood-primary mx-auto mb-3" />
                <p className="text-gray-900 font-medium mb-2">You're registered!</p>
                <p className="text-sm text-gray-600">Check your email for confirmation details.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    {opportunity.max_volunteers - opportunity.current_volunteers} spots remaining
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="progress-bar rounded-full"
                      style={{ 
                        width: `${(opportunity.current_volunteers / opportunity.max_volunteers) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <button
                  onClick={registerForOpportunity}
                  disabled={opportunity.current_volunteers >= opportunity.max_volunteers}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {opportunity.current_volunteers >= opportunity.max_volunteers 
                    ? 'Opportunity Full' 
                    : 'Register to Volunteer'
                  }
                </button>
                
                {!user && (
                  <p className="text-sm text-gray-600 text-center">
                    <button 
                      onClick={() => navigate('/login')}
                      className="text-dogood-primary hover:underline"
                    >
                      Sign in
                    </button> to register for this opportunity
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Map Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
            <div className="map-container mb-4">
              {opportunity.latitude && opportunity.longitude ? (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Map loading...</p>
                    <p className="text-xs text-gray-500">Google Maps integration</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Location: {opportunity.city}, {opportunity.state}</p>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={getDirections}
              className="w-full btn-outline flex items-center justify-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Get Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetail;
