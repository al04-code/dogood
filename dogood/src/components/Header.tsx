import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, User, LogOut, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/opportunities');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/opportunities', label: 'Opportunities' },
    { path: '/my-opportunities', label: 'My Opportunities', requiresAuth: true },
    { path: '/for-organizations', label: 'For Organizations' },
    { path: '/profile', label: 'Profile', requiresAuth: true },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-dogood-primary p-2 rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">DoGood</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-dogood-primary text-white'
                      : 'text-gray-700 hover:text-dogood-primary hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">
                    {userProfile?.user_type === 'organization' 
                      ? userProfile.organization_name 
                      : userProfile?.full_name}
                  </span>
                  {userProfile?.verified && (
                    <span className="ml-2 verified-badge">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-gray-700 hover:text-dogood-primary transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-dogood-primary transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-dogood-primary hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-dogood-primary text-white'
                        : 'text-gray-700 hover:text-dogood-primary hover:bg-gray-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            {user ? (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="px-3 py-2 text-sm text-gray-700">
                  <span className="font-medium">
                    {userProfile?.user_type === 'organization' 
                      ? userProfile.organization_name 
                      : userProfile?.full_name}
                  </span>
                  {userProfile?.verified && (
                    <span className="ml-2 verified-badge">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full mt-2 flex items-center justify-center space-x-2 text-gray-700 hover:text-dogood-primary transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:text-dogood-primary transition-colors duration-200 rounded-md hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-dogood-primary text-white rounded-md hover:bg-dogood-primary/90 transition-colors duration-200 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
