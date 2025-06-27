import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useAdminStore } from './stores/adminStore';
import { AuthForm } from './components/AuthForm';
import { BrokerSetup } from './components/BrokerSetup';
import { AdminLogin } from './components/AdminLogin';
import { Dashboard } from './components/Dashboard';
import { LiveTrading } from './components/LiveTrading';
import { ChoiceScreen } from './components/ChoiceScreen';
import { VPSPlans } from './components/VPSPlans';
import { UserProfile } from './components/UserProfile';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatbotButton } from './components/ChatbotButton';
import { LandingPage } from './components/LandingPage';
import { PackagesPage } from './components/PackagesPage';

// Import new page components
import AboutUs from './components/pages/AboutUs';
import Contact from './components/pages/Contact';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import TermsOfService from './components/pages/TermsOfService';
import Documentation from './components/pages/Documentation';
import ApiReference from './components/pages/ApiReference';
import Blog from './components/pages/Blog';
import Community from './components/pages/Community';

import './index.css';

function App() {
  const { 
    isAuthenticated, 
    userTokens, 
    fetchUserTokens, 
    purchaseVPSPlan, 
    credentials 
  } = useAuthStore();
  const { isAuthenticated: isAdminAuthenticated } = useAdminStore();
  const [selectedMode, setSelectedMode] = useState<'choice' | 'algotrading' | 'livetrading' | 'vps' | 'profile' | 'admin'>('choice');

  // Scroll to top whenever the mode changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [selectedMode]);

  // Fetch user tokens when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTokens();
    }
  }, [isAuthenticated, fetchUserTokens]);

  const handleSelectAlgoTrading = () => {
    setSelectedMode('algotrading');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleSelectLiveTrading = () => {
    setSelectedMode('livetrading');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleSelectVPS = () => {
    setSelectedMode('vps');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleBackToChoice = () => {
    setSelectedMode('choice');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Check if user is authenticated but hasn't connected a broker yet
  const needsBrokerSetup = isAuthenticated && !credentials;

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing Page */}
          <Route 
            path="/landing" 
            element={<LandingPage />} 
          />
          
          {/* Packages Page */}
          <Route 
            path="/packages" 
            element={<PackagesPage />} 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/login" 
            element={!isAdminAuthenticated ? <AdminLogin /> : <Navigate to="/admin" />} 
          />
          <Route 
            path="/admin" 
            element={isAdminAuthenticated ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
          />
          
          {/* User Routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <AuthForm /> : needsBrokerSetup ? <Navigate to="/broker-setup" /> : <Navigate to="/" />} 
          />
          <Route 
            path="/broker-setup" 
            element={isAuthenticated ? (needsBrokerSetup ? <BrokerSetup /> : <Navigate to="/" />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                needsBrokerSetup ? <Navigate to="/broker-setup" /> : (
                  <>
                    {selectedMode === 'choice' && (
                      <ChoiceScreen 
                        onSelectAlgoTrading={handleSelectAlgoTrading}
                        onSelectLiveTrading={handleSelectLiveTrading}
                      />
                    )}
                    {selectedMode === 'algotrading' && (
                      <Dashboard 
                        onBackToChoice={handleBackToChoice}
                        onSelectVPS={handleSelectVPS}
                      />
                    )}
                    {selectedMode === 'livetrading' && (
                      <LiveTrading 
                        onBackToOverview={handleBackToChoice}
                        onSelectVPS={handleSelectVPS}
                      />
                    )}
                    {selectedMode === 'vps' && userTokens && (
                      <VPSPlans 
                        userTokens={userTokens}
                        onPurchasePlan={purchaseVPSPlan}
                        onBackToChoice={handleBackToChoice}
                      />
                    )}
                    {selectedMode === 'profile' && (
                      <UserProfile onBackToChoice={handleBackToChoice} />
                    )}
                  </>
                )
              ) : (
                <Navigate to="/landing" />
              )
            } 
          />
          
          {/* Direct routes for navigation */}
          <Route 
            path="/profile" 
            element={
              isAuthenticated ? (
                needsBrokerSetup ? <Navigate to="/broker-setup" /> : (
                  <UserProfile onBackToChoice={handleBackToChoice} />
                )
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          {/* VPS route */}
          <Route 
            path="/vps" 
            element={
              isAuthenticated ? (
                needsBrokerSetup ? <Navigate to="/broker-setup" /> : (
                  userTokens ? (
                    <VPSPlans 
                      userTokens={userTokens}
                      onPurchasePlan={purchaseVPSPlan}
                      onBackToChoice={handleBackToChoice}
                    />
                  ) : (
                    <Navigate to="/" />
                  )
                )
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          {/* Legacy routes for backward compatibility */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                needsBrokerSetup ? <Navigate to="/broker-setup" /> : (
                  <Dashboard 
                    onBackToChoice={handleBackToChoice}
                    onSelectVPS={handleSelectVPS}
                  />
                )
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/live-trading" 
            element={
              isAuthenticated ? (
                needsBrokerSetup ? <Navigate to="/broker-setup" /> : (
                  <LiveTrading 
                    onBackToOverview={handleBackToChoice}
                    onSelectVPS={handleSelectVPS}
                  />
                )
              ) : (
                <Navigate to="/login" />
              )
            } 
          />

          {/* New Footer Pages */}
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/api-reference" element={<ApiReference />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/community" element={<Community />} />
        </Routes>
        
        {/* Chatbot Button - Only show when authenticated */}
        {isAuthenticated && !isAdminAuthenticated && <ChatbotButton />}
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;