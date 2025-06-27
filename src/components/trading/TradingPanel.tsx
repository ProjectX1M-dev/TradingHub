import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../stores/tradingStore';
import { useAuthStore } from '../../stores/authStore';
import { TrendingUp, TrendingDown, Calculator, AlertTriangle } from 'lucide-react';
import { formatPrice, calculateSpreadInPips, calculateRiskAmount, calculateOptimalLotSize, getPipValue } from '../../utils/tradingUtils';
import mt5ApiService from '../../lib/mt5ApiService';
import toast from 'react-hot-toast';

interface TradingPanelProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

interface TradeForm {
  symbol: string;
  action: 'BUY' | 'SELL';
  volume: number;
  orderType: 'market' | 'limit' | 'stop';
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

interface CurrentPriceState {
  bid: number;
  ask: number;
  time: string;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({ 
  selectedSymbol, 
  onSymbolChange 
}) => {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [currentPrice, setCurrentPrice] = useState<CurrentPriceState | null>(null);
  const [riskCalculation, setRiskCalculation] = useState<{
    riskAmount: number;
    riskPercentage: number;
    positionSize: number;
  } | null>(null);

  const { availableSymbols, executeSignal } = useTradingStore();
  const { accountInfo, isAuthenticated } = useAuthStore();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TradeForm>({
    defaultValues: {
      symbol: selectedSymbol,
      action: 'BUY',
      volume: 0.01,
      orderType: 'market',
    }
  });

  const watchedValues = watch();

  // Update form when selected symbol changes
  useEffect(() => {
    setValue('symbol', selectedSymbol);
  }, [selectedSymbol, setValue]);

  // Fetch real-time quotes from MT5 API
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        if (!isAuthenticated) {
          setCurrentPrice(null);
          return;
        }

        const quote = await mt5ApiService.getQuote(selectedSymbol);
        if (quote) {
          setCurrentPrice({
            bid: quote.bid,
            ask: quote.ask,
            time: quote.time
          });
        } else {
          setCurrentPrice(null);
        }
      } catch (error) {
        console.error('Failed to fetch real-time quote:', error);
        setCurrentPrice(null);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 1000); // Refresh every second
    return () => clearInterval(interval);
  }, [selectedSymbol, isAuthenticated]);

  // Calculate risk when form values change
  useEffect(() => {
    if (accountInfo && watchedValues.volume && watchedValues.stopLoss && currentPrice) {
      const entryPrice = action === 'BUY' ? currentPrice.ask : currentPrice.bid;
      const stopLossPrice = watchedValues.stopLoss;
      
      if (stopLossPrice && stopLossPrice !== entryPrice) {
        // Use the improved risk calculation function
        const riskAmount = calculateRiskAmount(
          entryPrice,
          stopLossPrice,
          watchedValues.volume,
          selectedSymbol
        );
        
        const riskPercentage = (riskAmount / accountInfo.balance) * 100;
        
        setRiskCalculation({
          riskAmount,
          riskPercentage,
          positionSize: watchedValues.volume
        });
      }
    }
  }, [watchedValues, currentPrice, action, selectedSymbol, accountInfo]);

  const onSubmit = async (data: TradeForm) => {
    try {
      const signal = {
        id: crypto.randomUUID(),
        symbol: data.symbol,
        action: data.action,
        volume: data.volume,
        price: data.orderType === 'market' ? undefined : data.price,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        timestamp: new Date().toISOString(),
        source: 'manual' as const,
      };

      const success = await executeSignal(signal);
      
      if (success) {
        toast.success(`${data.action} order placed successfully for ${data.symbol}`);
        // Reset form to default values
        setValue('volume', 0.01);
        setValue('price', undefined);
        setValue('stopLoss', undefined);
        setValue('takeProfit', undefined);
        setValue('comment', '');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  const calculateOptimalLotSizeForForm = () => {
    if (!accountInfo || !watchedValues.stopLoss || !currentPrice) return;

    const entryPrice = action === 'BUY' ? currentPrice.ask : currentPrice.bid;
    const stopLossPrice = watchedValues.stopLoss;
    
    if (stopLossPrice && stopLossPrice !== entryPrice) {
      // Use 2% risk by default
      const riskPercentage = 2;
      
      // Use the improved optimal lot size calculation
      const optimalLotSize = calculateOptimalLotSize(
        accountInfo.balance,
        riskPercentage,
        entryPrice,
        stopLossPrice,
        selectedSymbol
      );
      
      // Set the calculated lot size in the form
      setValue('volume', optimalLotSize);
      toast.success(`Optimal lot size calculated: ${optimalLotSize.toFixed(2)}`);
    } else {
      toast.error('Please set a stop loss price first');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Trading Form */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Place Order</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Symbol Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol
              </label>
              <select
                {...register('symbol', { required: 'Symbol is required' })}
                onChange={(e) => onSymbolChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            {/* Current Price Display with Dynamic Spread */}
            {currentPrice && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">BID</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatPrice(currentPrice.bid, selectedSymbol)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">ASK</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(currentPrice.ask, selectedSymbol)}
                    </p>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">
                    Spread: {calculateSpreadInPips(currentPrice.bid, currentPrice.ask, selectedSymbol).toFixed(1)} pips
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Last updated: {new Date(currentPrice.time).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {!currentPrice && isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-yellow-800 text-sm">
                    Unable to fetch real-time quotes for {selectedSymbol}. Using market order execution.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAction('BUY')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                  action === 'BUY'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>BUY</span>
              </button>
              <button
                type="button"
                onClick={() => setAction('SELL')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                  action === 'SELL'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>SELL</span>
              </button>
            </div>

            <input type="hidden" {...register('action')} value={action} />

            {/* Order Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Type
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'market' | 'limit' | 'stop')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="market">Market Order</option>
                <option value="limit">Limit Order</option>
                <option value="stop">Stop Order</option>
              </select>
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume (Lots)
              </label>
              <div className="flex space-x-2">
                <input
                  {...register('volume', { 
                    required: 'Volume is required',
                    min: { value: 0.01, message: 'Minimum volume is 0.01' },
                    max: { value: 100, message: 'Maximum volume is 100' },
                    valueAsNumber: true
                  })}
                  type="number"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={calculateOptimalLotSizeForForm}
                  className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Calculate optimal lot size (2% risk)"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </div>
              {errors.volume && (
                <p className="text-red-500 text-sm mt-1">{errors.volume.message}</p>
              )}
            </div>

            {/* Price (for limit/stop orders) */}
            {orderType !== 'market' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  {...register('price', { 
                    required: {
                      value: true,
                      message: 'Price is required for limit/stop orders'
                    },
                    min: { value: 0.00001, message: 'Price must be greater than 0' },
                    valueAsNumber: true
                  })}
                  type="number"
                  step="0.00001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>
            )}

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss
                </label>
                <input
                  {...register('stopLoss', { valueAsNumber: true })}
                  type="number"
                  step="0.00001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Take Profit
                </label>
                <input
                  {...register('takeProfit', { valueAsNumber: true })}
                  type="number"
                  step="0.00001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <input
                {...register('comment')}
                type="text"
                placeholder="Order comment"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                action === 'BUY'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Place {action} Order
            </button>
          </form>
        </div>
      </div>

      {/* Risk Calculator & Info */}
      <div className="space-y-6">
        {/* Risk Calculation */}
        {riskCalculation && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Amount:</span>
                <span className="font-semibold">
                  {accountInfo && new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: accountInfo.currency,
                  }).format(riskCalculation.riskAmount)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Percentage:</span>
                <span className={`font-semibold ${
                  riskCalculation.riskPercentage > 5 ? 'text-red-600' : 
                  riskCalculation.riskPercentage > 2 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {riskCalculation.riskPercentage.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Position Size:</span>
                <span className="font-semibold">{riskCalculation.positionSize} lots</span>
              </div>
            </div>

            {riskCalculation.riskPercentage > 5 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-red-800 text-sm font-medium">High Risk Warning</p>
                    <p className="text-red-700 text-sm">
                      This trade risks more than 5% of your account balance.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => setValue('volume', 0.01)}
              className="w-full py-2 px-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Set minimum volume (0.01)
            </button>
            
            <button
              onClick={() => {
                if (currentPrice) {
                  const price = action === 'BUY' ? currentPrice.ask : currentPrice.bid;
                  
                  // Use appropriate SL distance based on symbol
                  let slDistance: number;
                  
                  if (selectedSymbol.includes('XAU')) { // Gold
                    slDistance = 2.0; // $2 for gold
                  } else if (selectedSymbol.includes('XAG')) { // Silver
                    slDistance = 0.05; // 5 cents for silver
                  } else if (selectedSymbol.includes('JPY')) {
                    slDistance = 0.5; // 50 pips for JPY pairs
                  } else if (selectedSymbol.includes('US30') || selectedSymbol.includes('NAS100')) {
                    slDistance = 20; // 20 points for indices
                  } else if (selectedSymbol.includes('BTC')) {
                    slDistance = 100; // $100 for Bitcoin
                  } else if (selectedSymbol.includes('ETH')) {
                    slDistance = 10; // $10 for Ethereum
                  } else if (selectedSymbol.includes('OIL') || selectedSymbol.includes('USOIL')) {
                    slDistance = 0.5; // 50 cents for oil
                  } else {
                    slDistance = 0.005; // 50 pips for standard pairs
                  }
                  
                  setValue('stopLoss', action === 'BUY' ? price - slDistance : price + slDistance);
                }
              }}
              className="w-full py-2 px-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Set 50 pip stop loss
            </button>
            
            <button
              onClick={() => {
                if (currentPrice) {
                  const price = action === 'BUY' ? currentPrice.ask : currentPrice.bid;
                  
                  // Use appropriate TP distance based on symbol
                  let tpDistance: number;
                  
                  if (selectedSymbol.includes('XAU')) { // Gold
                    tpDistance = 4.0; // $4 for gold
                  } else if (selectedSymbol.includes('XAG')) { // Silver
                    tpDistance = 0.1; // 10 cents for silver
                  } else if (selectedSymbol.includes('JPY')) {
                    tpDistance = 1.0; // 100 pips for JPY pairs
                  } else if (selectedSymbol.includes('US30') || selectedSymbol.includes('NAS100')) {
                    tpDistance = 40; // 40 points for indices
                  } else if (selectedSymbol.includes('BTC')) {
                    tpDistance = 200; // $200 for Bitcoin
                  } else if (selectedSymbol.includes('ETH')) {
                    tpDistance = 20; // $20 for Ethereum
                  } else if (selectedSymbol.includes('OIL') || selectedSymbol.includes('USOIL')) {
                    tpDistance = 1.0; // $1 for oil
                  } else {
                    tpDistance = 0.01; // 100 pips for standard pairs
                  }
                  
                  setValue('takeProfit', action === 'BUY' ? price + tpDistance : price - tpDistance);
                }
              }}
              className="w-full py-2 px-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Set 100 pip take profit
            </button>
          </div>
        </div>

        {/* Market Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Info</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Symbol:</span>
              <span className="font-semibold">{selectedSymbol}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Pip Value:</span>
              <span className="font-semibold">
                {getPipValue(selectedSymbol)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Digits:</span>
              <span className="font-semibold">
                {selectedSymbol.includes('JPY') ? '3' : 
                 selectedSymbol.includes('XAU') || selectedSymbol.includes('XAG') ? '2' : 
                 selectedSymbol.includes('US30') || selectedSymbol.includes('NAS100') || selectedSymbol.includes('SPX500') ? '2' :
                 selectedSymbol.includes('BTC') ? '1' :
                 selectedSymbol.includes('ETH') ? '2' :
                 selectedSymbol.includes('OIL') || selectedSymbol.includes('USOIL') ? '2' : '5'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Min Volume:</span>
              <span className="font-semibold">0.01</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Max Volume:</span>
              <span className="font-semibold">100.00</span>
            </div>

            {currentPrice && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-xs font-medium">Real-time Data</p>
                <p className="text-blue-700 text-xs">
                  Live quotes from MT5 with accurate spread calculation using enhanced pip values.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};