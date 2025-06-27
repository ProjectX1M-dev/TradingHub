import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTradingStore } from '../stores/tradingStore';
import { PositionsTicker } from './PositionsTicker';
import { SignalsList } from './SignalsList';
import { RobotsList } from './RobotsList';
import { WebhookInfo } from './WebhookInfo';
import { UserPlugins } from './UserPlugins';
import { Header } from './Header';
import { AlertTriangle, Bot, Activity, Webhook, BarChart3, Users, Plus, DollarSign, Zap, Package } from 'lucide-react';

interface DashboardProps {
  onBackToChoice: () => void;
  onSelectVPS?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBackToChoice, onSelectVPS }) => {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  
  const { 
    accountInfo, 
    refreshAccountInfo, 
    lastAccountInfoUpdate,
    startAutoRefresh: startAccountAutoRefresh,
    stopAutoRefresh: stopAccountAutoRefresh,
    isAuthenticated,
    ensureMT5TokenStored,
    credentials
  } = useAuthStore();
  
  const { 
    fetchPositions, 
    fetchInitialSignals,
    fetchAvailableSymbols,
    fetchRobots,
    subscribeToSignals,
    startAutoRefresh: startPositionsAutoRefresh,
    stopAutoRefresh: stopPositionsAutoRefresh,
    startSignalsAutoRefresh,
    stopSignalsAutoRefresh,
    forceRefreshPositions,
    positions, 
    signals,
    robots,
    isLoading,
    lastPositionsUpdate,
    lastSignalsUpdate,
    availableSymbols
  } = useTradingStore();

  // Scroll to top when Dashboard component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Scroll to top when switching between sub-tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [activeSubTab]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial data fetch
    refreshAccountInfo();
    fetchPositions();
    fetchInitialSignals();
    fetchAvailableSymbols();
    fetchRobots();

    // Check and ensure MT5 token is stored
    const checkMT5Token = async () => {
      const tokenStored = await ensureMT5TokenStored();
      if (!tokenStored) {
        setShowTokenWarning(true);
      }
    };
    checkMT5Token();

    // Set up real-time signal subscription
    const unsubscribe = subscribeToSignals();

    // Start auto-refresh for account info, positions, and signals
    startAccountAutoRefresh();
    startPositionsAutoRefresh();
    startSignalsAutoRefresh();

    // Cleanup function
    return () => {
      unsubscribe();
      stopAccountAutoRefresh();
      stopPositionsAutoRefresh();
      stopSignalsAutoRefresh();
    };
  }, [
    isAuthenticated,
    refreshAccountInfo, 
    fetchPositions, 
    fetchInitialSignals, 
    fetchAvailableSymbols,
    fetchRobots,
    subscribeToSignals,
    startAccountAutoRefresh,
    stopAccountAutoRefresh,
    startPositionsAutoRefresh,
    stopPositionsAutoRefresh,
    startSignalsAutoRefresh,
    stopSignalsAutoRefresh,
    ensureMT5TokenStored
  ]);

  // Refetch robots when credentials change (e.g., when switching MT5 accounts)
  useEffect(() => {
    if (isAuthenticated && credentials) {
      console.log('Credentials changed, refetching robots...');
      fetchRobots();
    }
  }, [isAuthenticated, credentials, fetchRobots]);

  const handleManualRefresh = async () => {
    await Promise.all([
      refreshAccountInfo(),
      fetchPositions(),
      fetchInitialSignals(),
      fetchAvailableSymbols(),
      fetchRobots()
    ]);
  };

  const handleForceRefresh = async () => {
    await forceRefreshPositions();
  };

  const handleFixMT5Token = async () => {
    const tokenStored = await ensureMT5TokenStored();
    if (tokenStored) {
      setShowTokenWarning(false);
    }
  };

  // Calculate stats for overview cards
  const totalProfit = positions.reduce((sum, pos) => sum + pos.profit, 0);
  const activeRobots = robots.filter(r => r.isActive).length;
  const recentSignals = signals.filter(s => {
    const signalTime = new Date(s.timestamp);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return signalTime > hourAgo;
  }).length;

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'signals', label: 'Signals', icon: Activity },
    { id: 'plugins', label: 'Plugins', icon: Package },
    { id: 'copyfx', label: 'CopyFX', icon: Users }
  ];

  const handleSubTabChange = (tabId: string) => {
    setActiveSubTab(tabId);
    // Smooth scroll to top when changing tabs
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        accountInfo={accountInfo} 
        onBackToChoice={onBackToChoice}
        showBackButton={true}
        currentMode="algotrading"
        lastAccountInfoUpdate={lastAccountInfoUpdate}
        lastPositionsUpdate={lastPositionsUpdate}
        lastSignalsUpdate={lastSignalsUpdate}
        availableSymbols={availableSymbols}
        onManualRefresh={handleManualRefresh}
        onForceRefresh={handleForceRefresh}
        isLoading={isLoading}
        onSelectVPS={onSelectVPS}
      />
      
      {/* Enhanced Sub-menu Navigation with Prominent Stats */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Sub-menu Navigation */}
            <div className="flex space-x-8">
              {subTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSubTabChange(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeSubTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.id === 'copyfx' && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Prominent Stats Display - White/Light Background */}
            <div className="flex items-center space-x-4">
              {/* Total P&L */}
              <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="bg-gray-100 p-1.5 rounded-lg">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total P&L</p>
                  <p className={`text-sm font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {accountInfo && new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: accountInfo.currency,
                    }).format(totalProfit)}
                  </p>
                </div>
              </div>

              {/* Active Robots */}
              <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="bg-gray-100 p-1.5 rounded-lg">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Active Robots</p>
                  <p className="text-sm font-bold text-gray-900">{activeRobots}</p>
                </div>
              </div>

              {/* Recent Signals */}
              <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="bg-gray-100 p-1.5 rounded-lg">
                  <Zap className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Recent Signals</p>
                  <p className="text-sm font-bold text-gray-900">{recentSignals}</p>
                </div>
              </div>

              {/* Create Robot Button - Prominent */}
              <button
                onClick={() => {
                  // We'll need to pass this down to RobotsList or handle it here
                  const event = new CustomEvent('openCreateRobotModal');
                  window.dispatchEvent(event);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Create Robot</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* MT5 Token Warning */}
        {showTokenWarning && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">⚠️ Automatic Trading Not Available</h3>
                <p className="text-red-700 text-sm mt-1">
                  Your MT5 token is not stored in the database. This means TradingView webhooks will create signals but won't execute trades automatically.
                </p>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={handleFixMT5Token}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Fix MT5 Token
                  </button>
                  <button
                    onClick={() => setShowTokenWarning(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeSubTab === 'overview' && (
          <>
            {/* Open Positions - Moved Up */}
            <div className="mb-8">
              <PositionsTicker positions={positions} />
            </div>

            {/* Trading Robots - Moved Up */}
            <div className="mb-8">
              <RobotsList />
            </div>
          </>
        )}

        {activeSubTab === 'webhooks' && (
          <div className="max-w-4xl mx-auto">
            <WebhookInfo />
          </div>
        )}

        {activeSubTab === 'signals' && (
          <div className="max-w-4xl mx-auto">
            {/* Enhanced Signals Header */}
            <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 pb-2 inline-block">
                    Trading Signals
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Monitor and analyze all trading signals received from TradingView and manual sources
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Auto-executed</span>
                </div>
              </div>
            </div>
            <SignalsList />
          </div>
        )}

        {activeSubTab === 'plugins' && (
          <div className="max-w-4xl mx-auto">
            {/* Plugins Header */}
            <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-purple-500 pb-2 inline-block">
                    Trading Plugins
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Enhance your trading platform with powerful plugins and extensions
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-500">Premium Features</span>
                </div>
              </div>
            </div>
            <UserPlugins />
          </div>
        )}

        {activeSubTab === 'copyfx' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-12 text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">CopyFX Coming Soon</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Share your trading robots with other users and enable copy trading functionality. 
                Users will be able to purchase access to successful robots using tokens or promo codes.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="text-blue-800 font-medium mb-2">Planned Features</h4>
                <ul className="text-blue-700 text-sm space-y-1 text-left">
                  <li>• Share robots with unique tokens</li>
                  <li>• Copy successful trading strategies</li>
                  <li>• Token-based access system</li>
                  <li>• Performance-based pricing</li>
                  <li>• Real-time copy trading</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};