import React, { useState } from 'react';
import { LogOut, Settings, TrendingUp, Shield, Building, Wallet, DollarSign, ArrowLeft, Wifi, WifiOff, RefreshCw, Zap, User, Users, Server, Menu, X, MessageSquare, Package } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { AccountInfo } from '../types/mt5';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ChatbotModal } from './ChatbotModal';

interface HeaderProps {
  accountInfo?: AccountInfo | null;
  onBackToChoice?: () => void;
  showBackButton?: boolean;
  currentMode?: 'algotrading' | 'livetrading' | 'vps' | 'profile' | 'admin';
  // Real-time status props
  lastAccountInfoUpdate?: Date | null;
  lastPositionsUpdate?: Date | null;
  lastSignalsUpdate?: Date | null;
  availableSymbols?: string[];
  onManualRefresh?: () => void;
  onForceRefresh?: () => void;
  isLoading?: boolean;
  // VPS navigation prop
  onSelectVPS?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  accountInfo, 
  onBackToChoice, 
  showBackButton = false,
  currentMode,
  lastAccountInfoUpdate,
  lastPositionsUpdate,
  lastSignalsUpdate,
  availableSymbols = [],
  onManualRefresh,
  onForceRefresh,
  isLoading = false,
  onSelectVPS
}) => {
  const { logout, credentials, userTokens } = useAuthStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showChatbotModal, setShowChatbotModal] = useState(false);
  const navigate = useNavigate();

  const getAccountTypeInfo = () => {
    const accountType = accountInfo?.accountType || credentials?.accountType;
    
    switch (accountType) {
      case 'demo':
        return {
          label: 'Demo',
          icon: Shield,
          color: 'text-blue-600 bg-blue-100'
        };
      case 'live':
        return {
          label: 'Live',
          icon: TrendingUp,
          color: 'text-green-600 bg-green-100'
        };
      case 'prop':
        return {
          label: 'Prop',
          icon: Building,
          color: 'text-purple-600 bg-purple-100'
        };
      default:
        return {
          label: 'Unknown',
          icon: Shield,
          color: 'text-gray-600 bg-gray-100'
        };
    }
  };

  const accountTypeInfo = getAccountTypeInfo();
  const AccountTypeIcon = accountTypeInfo.icon;

  const formatCurrency = (amount: number) => {
    if (!accountInfo) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountInfo.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getModeTitle = () => {
    if (currentMode === 'algotrading') return 'Algorithmic Trading';
    if (currentMode === 'livetrading') return 'Live Trading';
    if (currentMode === 'vps') return 'VPS Hosting';
    if (currentMode === 'profile') return 'User Profile';
    if (currentMode === 'admin') return 'Admin Dashboard';
    return 'Trading Hub';
  };

  const getModeGradient = () => {
    if (currentMode === 'algotrading') return 'from-blue-500 to-purple-600';
    if (currentMode === 'livetrading') return 'from-green-500 to-emerald-600';
    if (currentMode === 'vps') return 'from-purple-500 to-indigo-600';
    if (currentMode === 'profile') return 'from-blue-500 to-indigo-600';
    if (currentMode === 'admin') return 'from-gray-700 to-gray-900';
    return 'bg-blue-600';
  };

  // Calculate if data is fresh
  const isAccountDataFresh = lastAccountInfoUpdate && 
    (Date.now() - lastAccountInfoUpdate.getTime()) < 2000;
  const isPositionsDataFresh = lastPositionsUpdate && 
    (Date.now() - lastPositionsUpdate.getTime()) < 1000;
  const isSignalsDataFresh = lastSignalsUpdate && 
    (Date.now() - lastSignalsUpdate.getTime()) < 1000;

  // Simple admin check (in a real app, this would be role-based)
  const isAdmin = credentials?.email === 'admin@example.com' || 
                  credentials?.email?.includes('admin');

  const handleProfileClick = () => {
    navigate('/profile');
    setShowMobileMenu(false);
  };

  const handleAdminClick = () => {
    navigate('/admin');
    setShowMobileMenu(false);
  };

  const handleSettingsClick = () => {
    navigate('/profile');
    setShowMobileMenu(false);
  };

  const handleVPSClick = () => {
    if (onSelectVPS) {
      onSelectVPS();
      setShowMobileMenu(false);
    } else {
      navigate('/vps');
      setShowMobileMenu(false);
    }
  };

  const handlePackagesClick = () => {
    navigate('/packages');
    setShowMobileMenu(false);
  };

  const handleBackClick = () => {
    if (onBackToChoice) {
      onBackToChoice();
      setShowMobileMenu(false);
    } else {
      // Fallback to navigating to root if onBackToChoice is not provided
      navigate('/');
      setShowMobileMenu(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowMobileMenu(false);
  };

  const handleOpenChatbot = () => {
    setShowChatbotModal(true);
    setShowMobileMenu(false);
  };

  return (
    <>
      {/* Real-time Status Bar - Above Header */}
      {(lastAccountInfoUpdate || lastPositionsUpdate || lastSignalsUpdate) && (
        <div className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-6 text-xs">
                {lastAccountInfoUpdate && (
                  <div className="flex items-center space-x-2">
                    {isAccountDataFresh ? (
                      <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-gray-300">
                      Account: {formatDistanceToNow(lastAccountInfoUpdate, { addSuffix: true })}
                    </span>
                  </div>
                )}
                {lastPositionsUpdate && (
                  <div className="flex items-center space-x-2">
                    {isPositionsDataFresh ? (
                      <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-gray-300">
                      Positions: {formatDistanceToNow(lastPositionsUpdate, { addSuffix: true })}
                    </span>
                  </div>
                )}
                {lastSignalsUpdate && (
                  <div className="flex items-center space-x-2">
                    {isSignalsDataFresh ? (
                      <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-orange-400" />
                    )}
                    <span className="text-gray-300">
                      Signals: {formatDistanceToNow(lastSignalsUpdate, { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Real-time updates</span>
                </div>
                {availableSymbols.length > 0 && (
                  <span className="text-blue-400 font-medium">
                    {availableSymbols.length} symbols loaded
                  </span>
                )}
                
                {/* Compact Action Buttons */}
                <div className="flex items-center space-x-1">
                  {onForceRefresh && (
                    <button
                      onClick={onForceRefresh}
                      disabled={isLoading}
                      className="p-1 text-purple-400 hover:text-purple-300 hover:bg-gray-800 rounded transition-colors"
                      title="Force sync"
                    >
                      <Zap className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  {onManualRefresh && (
                    <button
                      onClick={onManualRefresh}
                      disabled={isLoading}
                      className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-800 rounded transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Back Button + Website Logo + Balance Info */}
            <div className="flex items-center space-x-6">
              {/* Back to Hub Button + Website Logo */}
              <div className="flex items-center space-x-4">
                {showBackButton && (
                  <>
                    <button
                      onClick={handleBackClick}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Hub</span>
                    </button>
                    <div className="border-l border-gray-300 h-6"></div>
                  </>
                )}

                {/* Website Logo */}
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Trading Hub</h1>
                    {accountInfo && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${accountTypeInfo.color}`}>
                          <AccountTypeIcon className="w-3 h-3" />
                          <span>{accountTypeInfo.label}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Balance Information - Connected to Platform */}
              {accountInfo && (
                <div className="hidden md:flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Wallet className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(accountInfo.balance)}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-2`}>
                    <div className={`p-2 rounded-lg ${
                      accountInfo.profit >= 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <DollarSign className={`w-4 h-4 ${
                        accountInfo.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">P&L</p>
                      <p className={`text-sm font-semibold ${
                        accountInfo.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(accountInfo.profit)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Right Section - Current Mode + Token Balance + Navigation + Settings + Logout */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Token Balance */}
              {userTokens && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 rounded-lg">
                  <Wallet className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">
                    {userTokens.balance} tokens
                  </span>
                </div>
              )}

              {/* Current Mode Display */}
              {currentMode && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getModeGradient()}`}></div>
                  <span className="text-sm font-medium text-gray-700">{getModeTitle()}</span>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex items-center space-x-2">
                {/* Chatbot Button */}
                <button
                  onClick={handleOpenChatbot}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Chat Assistant"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                {/* Packages Button */}
                <button
                  onClick={handlePackagesClick}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Token Packages"
                >
                  <Package className="w-5 h-5" />
                </button>

                {/* VPS Button - Only show when not in VPS mode and onSelectVPS is provided */}
                {currentMode !== 'vps' && (
                  <button
                    onClick={handleVPSClick}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="VPS Hosting"
                  >
                    <Server className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={handleProfileClick}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Profile"
                >
                  <User className="w-5 h-5" />
                </button>

                {isAdmin && (
                  <button
                    onClick={handleAdminClick}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Admin Dashboard"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                )}

                <button 
                  onClick={handleSettingsClick}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Balance Info */}
          {accountInfo && (
            <div className="md:hidden border-t border-gray-200 py-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-gray-500">Balance: </span>
                    <span className="font-semibold">{formatCurrency(accountInfo.balance)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">P&L: </span>
                  <span className={`font-semibold ${
                    accountInfo.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(accountInfo.profit)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-3">
            {/* Token Balance */}
            {userTokens && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 rounded-lg">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  {userTokens.balance} tokens
                </span>
              </div>
            )}
            
            {/* Navigation Links */}
            <div className="space-y-2">
              <button
                onClick={handleOpenChatbot}
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
              >
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <span>Chat Assistant</span>
              </button>
              
              <button
                onClick={handlePackagesClick}
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
              >
                <Package className="w-5 h-5 text-gray-500" />
                <span>Token Packages</span>
              </button>
              
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
              >
                <User className="w-5 h-5 text-gray-500" />
                <span>Profile</span>
              </button>
              
              {currentMode !== 'vps' && (
                <button
                  onClick={handleVPSClick}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                >
                  <Server className="w-5 h-5 text-gray-500" />
                  <span>VPS Hosting</span>
                </button>
              )}
              
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                >
                  <Users className="w-5 h-5 text-gray-500" />
                  <span>Admin Dashboard</span>
                </button>
              )}
              
              {showBackButton && (
                <button
                  onClick={handleBackClick}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                  <span>Back to Hub</span>
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
              >
                <LogOut className="w-5 h-5 text-gray-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Modal */}
      <ChatbotModal isOpen={showChatbotModal} onClose={() => setShowChatbotModal(false)} />
    </>
  );
};