import React, { useState, useEffect } from 'react';
import { Position } from '../types/mt5';
import { TrendingUp, TrendingDown, Wifi, Eye, ChevronRight } from 'lucide-react';
import { PositionsDetailModal } from './PositionsDetailModal';

interface PositionsTickerProps {
  positions: Position[];
}

export const PositionsTicker: React.FC<PositionsTickerProps> = ({ positions }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalProfit = positions.reduce((sum, pos) => sum + pos.profit, 0);

  // Auto-scroll through positions every 3 seconds
  useEffect(() => {
    if (positions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.min(positions.length, 10));
    }, 3000);

    return () => clearInterval(interval);
  }, [positions.length]);

  // Get the last 10 positions for the ticker
  const tickerPositions = positions.slice(0, 10);

  if (positions.length === 0) {
    return (
      <>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Open Positions</h2>
            <div className="flex items-center space-x-1">
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-500">Live</span>
            </div>
          </div>
          <div className="text-center py-6">
            <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No open positions</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Open Positions</h2>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Total P&L</p>
                <p className={`text-sm font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Ticker Display */}
        <div className="relative overflow-hidden">
          {/* Current Position Display */}
          <div className="p-4 border-b border-gray-100">
            {tickerPositions.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    tickerPositions[currentIndex].type === 'Buy' 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {tickerPositions[currentIndex].type === 'Buy' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {tickerPositions[currentIndex].symbol}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tickerPositions[currentIndex].type} {tickerPositions[currentIndex].volume} lots
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${
                    tickerPositions[currentIndex].profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(tickerPositions[currentIndex].profit)}
                  </p>
                  <p className="text-sm text-gray-500">
                    @ {tickerPositions[currentIndex].currentPrice || tickerPositions[currentIndex].openPrice}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Position Indicators */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
            <div className="flex items-center space-x-1">
              {tickerPositions.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Showing {currentIndex + 1} of {Math.min(positions.length, 10)}
              </span>
              <button
                onClick={() => setShowDetailModal(true)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Eye className="w-4 h-4" />
                <span>See All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <PositionsDetailModal 
          positions={positions} 
          onClose={() => setShowDetailModal(false)} 
        />
      )}
    </>
  );
};