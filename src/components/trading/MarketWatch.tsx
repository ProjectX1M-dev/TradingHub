import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../../stores/tradingStore';
import { Search, TrendingUp, TrendingDown, Star, StarOff, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface MarketWatchProps {
  onSymbolSelect: (symbol: string) => void;
  selectedSymbol: string;
}

interface SymbolQuote {
  symbol: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

export const MarketWatch: React.FC<MarketWatchProps> = ({ 
  onSymbolSelect, 
  selectedSymbol 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['EURUSD', 'GBPUSD', 'USDJPY']);
  const [quotes, setQuotes] = useState<SymbolQuote[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'forex' | 'crypto' | 'indices'>('all');
  
  const { availableSymbols, executeSignal } = useTradingStore();

  // Simulate real-time quotes
  useEffect(() => {
    const generateQuote = (symbol: string): SymbolQuote => {
      const basePrice = symbol === 'EURUSD' ? 1.0850 : 
                       symbol === 'GBPUSD' ? 1.2650 :
                       symbol === 'USDJPY' ? 150.25 :
                       symbol === 'AUDUSD' ? 0.6750 :
                       symbol === 'USDCAD' ? 1.3450 :
                       symbol === 'NZDUSD' ? 0.6150 :
                       symbol === 'USDCHF' ? 0.9050 :
                       symbol === 'XAUUSD' ? 2050.50 :
                       symbol === 'BTCUSD' ? 45000 :
                       symbol === 'US30' ? 35000 : 1.0000;
      
      const spread = symbol.includes('USD') ? 0.0002 : 
                    symbol.includes('XAU') ? 0.50 :
                    symbol.includes('BTC') ? 10 : 0.0002;
      
      const variation = (Math.random() - 0.5) * 0.002;
      const change = (Math.random() - 0.5) * 0.01;
      
      return {
        symbol,
        bid: basePrice + variation,
        ask: basePrice + variation + spread,
        change: change,
        changePercent: (change / basePrice) * 100,
        high: basePrice + Math.abs(variation) + 0.005,
        low: basePrice - Math.abs(variation) - 0.005,
        volume: Math.floor(Math.random() * 1000000)
      };
    };

    const updateQuotes = () => {
      const newQuotes = availableSymbols.slice(0, 50).map(generateQuote);
      setQuotes(newQuotes);
    };

    updateQuotes();
    const interval = setInterval(updateQuotes, 2000);
    return () => clearInterval(interval);
  }, [availableSymbols]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const getSymbolCategory = (symbol: string) => {
    if (symbol.match(/^[A-Z]{6}$/)) return 'forex';
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('LTC')) return 'crypto';
    if (symbol.includes('US30') || symbol.includes('NAS100') || symbol.includes('SPX500')) return 'indices';
    return 'other';
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'favorites' && favorites.includes(quote.symbol)) ||
                         getSymbolCategory(quote.symbol) === filter;
    return matchesSearch && matchesFilter;
  });

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('JPY')) return price.toFixed(3);
    if (symbol.includes('XAU') || symbol.includes('BTC')) return price.toFixed(2);
    return price.toFixed(5);
  };

  // Handle quick trade execution from market watch
  const handleQuickTrade = async (symbol: string, action: 'BUY' | 'SELL', quote: SymbolQuote) => {
    try {
      const signal = {
        id: crypto.randomUUID(),
        symbol: symbol,
        action: action,
        volume: 0.01, // Default volume
        price: action === 'BUY' ? quote.ask : quote.bid,
        timestamp: new Date().toISOString(),
        source: 'manual' as const,
      };

      console.log(`🚀 Quick ${action} trade for ${symbol} at ${signal.price}`);
      
      const success = await executeSignal(signal);
      
      if (success) {
        toast.success(`${action} order placed for ${symbol} at ${formatPrice(signal.price!, symbol)}`);
        onSymbolSelect(symbol); // Select the symbol after trade
      }
    } catch (error) {
      console.error('Quick trade failed:', error);
      toast.error(`Failed to place ${action} order for ${symbol}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Market Watch</h2>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Live Prices</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'forex', label: 'Forex' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'indices', label: 'Indices' }
          ].map(filterOption => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id as any)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === filterOption.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ask
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                High/Low
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quick Trade
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQuotes.map((quote) => (
              <tr
                key={quote.symbol}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedSymbol === quote.symbol ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSymbolSelect(quote.symbol)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(quote.symbol);
                      }}
                      className="text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      {favorites.includes(quote.symbol) ? (
                        <Star className="w-4 h-4 fill-current text-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>
                    <span className="font-medium text-gray-900">{quote.symbol}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600">
                  {formatPrice(quote.bid, quote.symbol)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-600">
                  {formatPrice(quote.ask, quote.symbol)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center space-x-1 ${
                    quote.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {quote.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-sm font-medium">
                      {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div>H: {formatPrice(quote.high, quote.symbol)}</div>
                    <div>L: {formatPrice(quote.low, quote.symbol)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickTrade(quote.symbol, 'BUY', quote);
                      }}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title={`Buy ${quote.symbol} at ${formatPrice(quote.ask, quote.symbol)}`}
                    >
                      <Play className="w-3 h-3" />
                      <span>BUY</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickTrade(quote.symbol, 'SELL', quote);
                      }}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      title={`Sell ${quote.symbol} at ${formatPrice(quote.bid, quote.symbol)}`}
                    >
                      <Play className="w-3 h-3" />
                      <span>SELL</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredQuotes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No symbols found matching your criteria</p>
        </div>
      )}
    </div>
  );
};