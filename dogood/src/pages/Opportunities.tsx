import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { Search, Filter, MapPin, Clock, Users, Heart, Building } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  organization_verified: boolean;
  location: string;
  city: string;
  date: string;
  time: string;
  hours_needed: number;
  cause_category: 'STEM' | 'Environment' | 'Health' | 'Education' | 'Other';
  max_volunteers: number;
  current_volunteers: number;
}

const Opportunities: React.FC = () => {
  const { supabase } = useSupabase();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedHours, setSelectedHours] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const categories = ['STEM', 'Environment', 'Health', 'Education', 'Other'];
  const hoursOptions = ['<2', '2-5', '5+'];

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          organizations:organization_id (
            name,
            verified
          )
        `)
        .eq('status', 'active')
        .order('date', { ascending: true });

      // Apply filters
      if (selectedCategory) {
        query = query.eq('cause_category', selectedCategory);
      }
      
      if (selectedHours) {
        if (selectedHours === '<2') {
          query = query.lt('hours_needed', 2);
        } else if (selectedHours === '2-5') {
          query = query.gte('hours_needed', 2).lte('hours_needed', 5);
        } else if (selectedHours === '5+') {
          query = query.gt('hours_needed', 5);
        }
      }

      if (selectedLocation) {
        query = query.ilike('city', `%${selectedLocation}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching opportunities:', error);
        return;
      }

      // Transform data to match our interface
      const transformedData = data?.map(opp => ({
        id: opp.id,
        title: opp.title,
        description: opp.description,
        organization_name: opp.organizations?.name || 'Unknown Organization',
        organization_verified: opp.organizations?.verified || false,
        location: opp.location,
        city: opp.city,
        date: opp.date,
        time: opp.time,
        hours_needed: opp.hours_needed,
        cause_category: opp.cause_category,
        max_volunteers: opp.max_volunteers,
        current_volunteers: opp.current_volunteers
      })) || [];

      setOpportunities(transformedData);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opp =>
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedHours('');
    setSelectedLocation('');
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Volunteer Opportunities
        </h1>
        <p className="text-gray-600">
          Discover meaningful ways to give back to your community in the Dallas-Fort Worth area
        </p>
      </div>

      {/* Filters Panel */}
      <div className="filter-panel">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-dogood-primary hover:text-dogood-primary/80 underline"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="search-input">
            <Search className="search-icon h-5 w-5" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Hours Filter */}
          <select
            value={selectedHours}
            onChange={(e) => setSelectedHours(e.target.value)}
            className="input-field"
          >
            <option value="">All Hours</option>
            {hoursOptions.map(hours => (
              <option key={hours} value={hours}>{hours} hours</option>
            ))}
          </select>

          {/* Location Filter */}
          <input
            type="text"
            placeholder="City or location..."
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {filteredOpportunities.length} opportunity{filteredOpportunities.length !== 1 ? 'ies' : 'y'} found
        </p>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading-spinner"></div>
          <span className="ml-3 text-gray-600">Loading opportunities...</span>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
          <p className="text-gray-600">
            Try adjusting your filters or check back later for new opportunities.
          </p>
        </div>
      ) : (
        <div className="opportunities-grid">
          {filteredOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="card opportunity-card">
              <div className="flex items-start justify-between mb-3">
                <span className={`category-badge ${getCategoryClass(opportunity.cause_category)}`}>
                  {opportunity.cause_category}
                </span>
                <div className="flex items-center space-x-2">
                  {opportunity.organization_verified && (
                    <span className="verified-badge">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {opportunity.title}
              </h3>

              <p className="text-gray-600 mb-4 line-clamp-3">
                {opportunity.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="font-medium">{opportunity.organization_name}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{opportunity.city}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{formatDate(opportunity.date)} at {opportunity.time}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{opportunity.hours_needed} hours needed</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {opportunity.current_volunteers}/{opportunity.max_volunteers} volunteers
                </div>
                <Link
                  to={`/opportunities/${opportunity.id}`}
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
  );
};

export default Opportunities;
