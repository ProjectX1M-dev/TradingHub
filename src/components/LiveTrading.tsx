import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../stores/tradingStore';
import { useAuthStore } from '../stores/authStore';
import { TradingPanel } from './trading/TradingPanel';
import { MarketWatch } from './trading/MarketWatch';
import { OrderBook } from './trading/OrderBook';
import { TradingChart } from './trading/TradingChart';
import { PositionsManager } from './trading/PositionsManager';
import { RiskManager } from './trading/RiskManager';
import { Header } from './Header';
import { TrendingUp, Activity, BarChart3, Shield, List, Eye } from 'lucide-react';

interface LiveTradingProps {
  onBackToOverview: () => void;
  onSelectVPS?: () => void;
}

export const LiveTrading: React.FC<LiveTradingProps> = ({ onBackToOverview, onSelectVPS }) => {
  const [activeTab, setActiveTab] = useState('trading');
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const { accountInfo } = useAuthStore();
  const { positions, fetchAvailableSymbols } = useTradingStore();

  // Scroll to top when LiveTrading component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Fetch available symbols when component mounts
  useEffect(() => {
    console.log('LiveTrading: Fetching available symbols...');
    fetchAvailableSymbols();
  }, [fetchAvailableSymbols]);

  // Scroll to top when switching between tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [activeTab]);

  const tabs = [
    { id: 'trading', label: 'Trading Panel', icon: TrendingUp },
    { id: 'market', label: 'Market Watch', icon: Activity },
    { id: 'chart', label: 'Chart', icon: BarChart3 },
    { id: 'positions', label: 'Positions', icon: List },
    { id: 'orders', label: 'Order Book', icon: Eye },
    { id: 'risk', label: 'Risk Manager', icon: Shield },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Smooth scroll to top when changing tabs
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        accountInfo={accountInfo} 
        onBackToChoice={onBackToOverview}
        showBackButton={true}
        currentMode="livetrading"
        onSelectVPS={onSelectVPS}
      />
      
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Live Trading</h1>
                <p className="text-sm text-gray-500">Real-time trading terminal</p>
              </div>
            </div>
            
            {accountInfo && (
              <div className="hidden lg:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Balance</p>
                  <p className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: accountInfo.currency,
                    }).format(accountInfo.balance)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Equity</p>
                  <p className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: accountInfo.currency,
                    }).format(accountInfo.equity)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Free Margin</p>
                  <p className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: accountInfo.currency,
                    }).format(accountInfo.freeMargin)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Open Positions</p>
                  <p className="font-semibold text-gray-900">{positions.length}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8 border-t border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'trading' && (
          <TradingPanel 
            selectedSymbol={selectedSymbol}
            onSymbolChange={setSelectedSymbol}
          />
        )}
        
        {activeTab === 'market' && (
          <MarketWatch 
            onSymbolSelect={setSelectedSymbol}
            selectedSymbol={selectedSymbol}
          />
        )}
        
        {activeTab === 'chart' && (
          <TradingChart symbol={selectedSymbol} />
        )}
        
        {activeTab === 'positions' && (
          <PositionsManager />
        )}
        
        {activeTab === 'orders' && (
          <OrderBook />
        )}
        
        {activeTab === 'risk' && (
          <RiskManager />
        )}
      </div>
    </div>
  );
};