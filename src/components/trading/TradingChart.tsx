import React, { useState, useEffect } from 'react';
import { BarChart3, Activity } from 'lucide-react';
import mt5ApiService from '../../lib/mt5ApiService';
import { useAuthStore } from '../../stores/authStore';

interface TradingChartProps {
  symbol: string;
}

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState('1H');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const { isAuthenticated } = useAuthStore();

  // Fetch historical chart data and real-time price
  useEffect(() => {
    let historyInterval: NodeJS.Timeout;
    let priceInterval: NodeJS.Timeout;

    const fetchChartData = async () => {
      if (!isAuthenticated) {
        setChartData([]);
        return;
      }
      try {
        // Assuming mt5ApiService.getHistory returns data in CandlestickData format
        const history = await mt5ApiService.getHistory(symbol, timeframe, 100); // Fetch 100 bars
        if (history) {
          setChartData(history);
        }
      } catch (error) {
        console.error(`Failed to fetch historical data for ${symbol} (${timeframe}):`, error);
        setChartData([]);
      }
    };

    const fetchCurrentPrice = async () => {
      if (!isAuthenticated) {
        setCurrentPrice(0);
        return;
      }
      try {
        const quote = await mt5ApiService.getQuote(symbol);
        if (quote) {
          setCurrentPrice((quote.bid + quote.ask) / 2);
        }
      } catch (error) {
        console.error(`Failed to fetch current price for ${symbol}:`, error);
        setCurrentPrice(0);
      }
    };

    if (isAuthenticated) {
      fetchChartData(); // Initial fetch for historical data
      historyInterval = setInterval(fetchChartData, 60000); // Refresh historical data every minute

      fetchCurrentPrice(); // Initial fetch for current price
      priceInterval = setInterval(fetchCurrentPrice, 1000); // Refresh current price every second
    }

    return () => {
      clearInterval(historyInterval);
      clearInterval(priceInterval);
    };
  }, [symbol, timeframe, isAuthenticated]);

  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];

  const formatPrice = (price: number) => {
    if (symbol.includes('JPY')) return price.toFixed(3);
    return price.toFixed(5);
  };

  const getChangeColor = (open: number, close: number) => {
    return close >= open ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">{symbol} Chart</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-500">Live</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeframe === tf
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-6">
        <div className="h-96 bg-gray-50 rounded-lg relative overflow-hidden">
          {/* Simple Candlestick Chart Representation */}
          <div className="flex items-end justify-between h-full p-4 space-x-1">
            {chartData.slice(-50).map((candle, index) => {
              const height = Math.max(10, Math.abs(candle.high - candle.low) * 10000);
              const bodyHeight = Math.max(2, Math.abs(candle.close - candle.open) * 10000);
              const isGreen = candle.close >= candle.open;
              
              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-end"
                  style={{ height: `${height}px` }}
                >
                  {/* Wick */}
                  <div
                    className="w-0.5 bg-gray-400"
                    style={{ 
                      height: `${height}px`,
                      marginBottom: `-${bodyHeight}px`
                    }}
                  />
                  {/* Body */}
                  <div
                    className={`w-2 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ height: `${bodyHeight}px` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Price Labels */}
          <div className="absolute right-2 top-4 space-y-2">
            {chartData.length > 0 && (
              <>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
                  H: {formatPrice(Math.max(...chartData.slice(-50).map(c => c.high)))}
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
                  L: {formatPrice(Math.min(...chartData.slice(-50).map(c => c.low)))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {chartData.length > 0 && (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-500">Open</p>
                <p className="font-semibold">
                  {formatPrice(chartData[chartData.length - 1]?.open || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">High</p>
                <p className="font-semibold text-green-600">
                  {formatPrice(chartData[chartData.length - 1]?.high || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Low</p>
                <p className="font-semibold text-red-600">
                  {formatPrice(chartData[chartData.length - 1]?.low || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Close</p>
                <p className={`font-semibold ${getChangeColor(
                  chartData[chartData.length - 1]?.open || 0,
                  chartData[chartData.length - 1]?.close || 0
                )}`}>
                  {formatPrice(chartData[chartData.length - 1]?.close || 0)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};