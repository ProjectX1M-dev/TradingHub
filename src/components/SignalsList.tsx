import React from 'react';
import { useTradingStore } from '../stores/tradingStore';
import { TrendingUp, TrendingDown, Clock, ExternalLink, Zap, Wifi } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const SignalsList: React.FC = () => {
  const { signals, lastSignalsUpdate } = useTradingStore();

  // Calculate if signals data is fresh (updated within last 2 seconds)
  const isSignalsDataFresh = lastSignalsUpdate && 
    (Date.now() - lastSignalsUpdate.getTime()) < 1000;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 border-b-2 border-blue-500 pb-1 inline-block">
            Trading Signals
          </h2>
          <div className="flex items-center space-x-2 text-sm">
            {isSignalsDataFresh ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <Wifi className="w-4 h-4 text-orange-500" />
            )}
            <span className="text-gray-500">
              {lastSignalsUpdate ? 
                `Updated ${formatDistanceToNow(lastSignalsUpdate, { addSuffix: true })}` : 
                'Never updated'
              }
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-500">Auto-executed</span>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {signals.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No signals received</p>
            <p className="text-sm text-gray-400 mt-1">
              Configure your TradingView webhook to start receiving signals
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {signals.map((signal) => (
              <div key={signal.id} className="p-4 relative">
                {/* Real-time indicator for each signal */}
                <div className="absolute top-2 right-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      signal.action === 'BUY' 
                        ? 'bg-green-50 text-green-600' 
                        : signal.action === 'SELL'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      {signal.action === 'BUY' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : signal.action === 'SELL' ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {signal.action} {signal.symbol}
                      </p>
                      <p className="text-sm text-gray-500">
                        Volume: {signal.volume} | Source: {signal.source}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status indicator instead of execute button */}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-600 font-medium">Auto-executed</span>
                  </div>
                </div>
                
                {(signal.price || signal.stopLoss || signal.takeProfit) && (
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    {signal.price && (
                      <div>
                        <p className="text-gray-500">Price</p>
                        <p className="font-medium">{signal.price}</p>
                      </div>
                    )}
                    {signal.stopLoss && (
                      <div>
                        <p className="text-gray-500">Stop Loss</p>
                        <p className="font-medium">{signal.stopLoss}</p>
                      </div>
                    )}
                    {signal.takeProfit && (
                      <div>
                        <p className="text-gray-500">Take Profit</p>
                        <p className="font-medium">{signal.takeProfit}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-1 mt-3 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(signal.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};