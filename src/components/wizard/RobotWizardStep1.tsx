import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Target, TrendingUp, BarChart3, Zap, Grid3X3, TrendingUp as ArrowTrendingUp } from 'lucide-react';

interface Step1Data {
  name: string;
  symbol: string;
  strategy: string;
}

interface RobotWizardStep1Props {
  data: Step1Data;
  onNext: (data: Step1Data) => void;
  availableSymbols: string[];
}

const STRATEGIES = [
  {
    id: 'Scalping',
    name: 'Scalping',
    description: 'Quick trades capturing small price movements',
    icon: Zap,
    color: 'yellow',
    characteristics: ['High frequency', 'Small profits', 'Quick execution']
  },
  {
    id: 'Trend Following',
    name: 'Trend Following',
    description: 'Follow market trends for sustained moves',
    icon: TrendingUp,
    color: 'green',
    characteristics: ['Medium frequency', 'Trend-based', 'Momentum driven']
  },
  {
    id: 'Mean Reversion',
    name: 'Mean Reversion',
    description: 'Trade when price deviates from average',
    icon: BarChart3,
    color: 'blue',
    characteristics: ['Counter-trend', 'Statistical edge', 'Range-bound']
  },
  {
    id: 'Breakout',
    name: 'Breakout',
    description: 'Trade when price breaks key levels',
    icon: ArrowTrendingUp,
    color: 'purple',
    characteristics: ['Volatility-based', 'Level breaks', 'Momentum']
  },
  {
    id: 'Grid Trading',
    name: 'Grid Trading',
    description: 'Place orders at regular intervals',
    icon: Grid3X3,
    color: 'indigo',
    characteristics: ['Systematic', 'Range markets', 'Multiple orders']
  }
];

export const RobotWizardStep1: React.FC<RobotWizardStep1Props> = ({
  data,
  onNext,
  availableSymbols
}) => {
  const [symbolFilter, setSymbolFilter] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState(data.strategy || '');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step1Data>({
    defaultValues: data
  });

  const watchedSymbol = watch('symbol');

  // Filter symbols based on search input
  const filteredSymbols = availableSymbols.filter(symbol =>
    symbol.toLowerCase().includes(symbolFilter.toLowerCase())
  );

  // Show first 50 symbols to avoid overwhelming the dropdown
  const displaySymbols = filteredSymbols.slice(0, 50);

  const onSubmit = (formData: Step1Data) => {
    onNext({
      ...formData,
      strategy: selectedStrategy
    });
  };

  const getStrategyInfo = (strategyId: string) => {
    return STRATEGIES.find(s => s.id === strategyId);
  };

  const selectedStrategyInfo = getStrategyInfo(selectedStrategy);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Robot Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Robot Name
        </label>
        <input
          {...register('name', { required: 'Robot name is required' })}
          type="text"
          placeholder="e.g., EURUSD Scalper Pro"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Choose a descriptive name that helps you identify this robot
        </p>
      </div>

      {/* Symbol Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trading Symbol
          {availableSymbols.length > 0 && (
            <span className="text-xs text-gray-500 ml-1">
              ({availableSymbols.length} available from your broker)
            </span>
          )}
        </label>
        
        {/* Symbol search input */}
        {availableSymbols.length > 10 && (
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search symbols..."
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        )}

        <select
          {...register('symbol', { required: 'Symbol is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a symbol</option>
          {displaySymbols.map(symbol => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
          {filteredSymbols.length > 50 && (
            <option disabled>... and {filteredSymbols.length - 50} more (refine search)</option>
          )}
        </select>
        
        {errors.symbol && (
          <p className="text-red-500 text-sm mt-1">{errors.symbol.message}</p>
        )}
        
        {symbolFilter && filteredSymbols.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            No symbols found matching "{symbolFilter}"
          </p>
        )}
        
        {availableSymbols.length === 0 && (
          <p className="text-sm text-yellow-600 mt-1">
            Symbols are being loaded from your broker...
          </p>
        )}

        {/* Show info about selected symbol */}
        {watchedSymbol && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-600" />
              <p className="text-green-800 text-sm">
                <strong>Selected:</strong> {watchedSymbol}
              </p>
            </div>
            <p className="text-green-700 text-xs mt-1">
              This robot will trade exclusively on {watchedSymbol} using your chosen strategy
            </p>
          </div>
        )}
      </div>

      {/* Strategy Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Trading Strategy
        </label>
        <div className="grid grid-cols-1 gap-3">
          {STRATEGIES.map((strategy) => {
            const Icon = strategy.icon;
            const isSelected = selectedStrategy === strategy.id;
            
            return (
              <label
                key={strategy.id}
                className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? `border-${strategy.color}-500 bg-${strategy.color}-50`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  value={strategy.id}
                  checked={selectedStrategy === strategy.id}
                  onChange={() => setSelectedStrategy(strategy.id)}
                  className="sr-only"
                />
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? `bg-${strategy.color}-100`
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isSelected
                      ? `text-${strategy.color}-600`
                      : 'text-gray-500'
                  }`} />
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {strategy.name}
                  </p>
                  <p className={`text-xs ${
                    isSelected ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {strategy.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {strategy.characteristics.map((char, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          isSelected
                            ? `bg-${strategy.color}-100 text-${strategy.color}-700`
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div className={`w-5 h-5 rounded-full bg-${strategy.color}-500 flex items-center justify-center`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </label>
            );
          })}
        </div>
        
        {!selectedStrategy && (
          <p className="text-red-500 text-sm mt-1">Please select a trading strategy</p>
        )}
      </div>

      {/* Strategy Info */}
      {selectedStrategyInfo && (
        <div className={`p-4 rounded-lg border border-${selectedStrategyInfo.color}-200 bg-${selectedStrategyInfo.color}-50`}>
          <div className="flex items-start space-x-3">
            <selectedStrategyInfo.icon className={`w-5 h-5 text-${selectedStrategyInfo.color}-600 flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`text-${selectedStrategyInfo.color}-800 text-sm font-medium`}>
                {selectedStrategyInfo.name} Strategy Selected
              </p>
              <p className={`text-${selectedStrategyInfo.color}-700 text-xs mt-1`}>
                {selectedStrategyInfo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={!selectedStrategy}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Risk Settings
        </button>
      </div>
    </form>
  );
};