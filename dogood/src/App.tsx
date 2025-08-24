import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import Header from './components/Header';
import Opportunities from './pages/Opportunities';
import MyOpportunities from './pages/MyOpportunities';
import ForOrganizations from './pages/ForOrganizations';
import Profile from './pages/Profile';
import OpportunityDetail from './pages/OpportunityDetail';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import OrganizationRegister from './components/auth/OrganizationRegister';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Navigate to="/opportunities" replace />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/opportunities/:id" element={<OpportunityDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/organization" element={<OrganizationRegister />} />
                
                <Route path="/my-opportunities" element={
                  <ProtectedRoute>
                    <MyOpportunities />
                  </ProtectedRoute>
                } />
                
                <Route path="/for-organizations" element={<ForOrganizations />} />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </SupabaseProvider>
  );
}

export default App;
