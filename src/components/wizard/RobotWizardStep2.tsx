import React from 'react';
import { useForm } from 'react-hook-form';
import { Shield, AlertTriangle, Calculator, TrendingUp, DollarSign, Target } from 'lucide-react';

interface Step2Data {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  maxLotSize: number;
  stopLoss: number;
  takeProfit: number;
}

interface RobotWizardStep2Props {
  data: Step2Data;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  strategy: string;
  symbol: string;
}

const RISK_LEVELS = [
  {
    id: 'LOW',
    name: 'Conservative',
    description: 'Minimal risk with steady growth',
    icon: Shield,
    color: 'green',
    characteristics: ['Low drawdown', 'Steady returns', 'Capital preservation'],
    recommendedLot: 0.01,
    recommendedSL: 30,
    recommendedTP: 60
  },
  {
    id: 'MEDIUM',
    name: 'Balanced',
    description: 'Moderate risk for balanced returns',
    icon: TrendingUp,
    color: 'blue',
    characteristics: ['Balanced approach', 'Moderate volatility', 'Growth focused'],
    recommendedLot: 0.05,
    recommendedSL: 50,
    recommendedTP: 100
  },
  {
    id: 'HIGH',
    name: 'Aggressive',
    description: 'Higher risk for maximum returns',
    icon: Target,
    color: 'red',
    characteristics: ['High returns', 'Higher volatility', 'Growth aggressive'],
    recommendedLot: 0.1,
    recommendedSL: 80,
    recommendedTP: 150
  }
];

const STRATEGY_RECOMMENDATIONS = {
  'Scalping': {
    defaultSL: 15,
    defaultTP: 25,
    description: 'Tight stops for quick scalping trades'
  },
  'Trend Following': {
    defaultSL: 50,
    defaultTP: 100,
    description: 'Wider stops to ride trends'
  },
  'Mean Reversion': {
    defaultSL: 40,
    defaultTP: 60,
    description: 'Moderate stops for reversion trades'
  },
  'Breakout': {
    defaultSL: 60,
    defaultTP: 120,
    description: 'Wider stops for breakout momentum'
  },
  'Grid Trading': {
    defaultSL: 100,
    defaultTP: 50,
    description: 'Large stops with smaller targets'
  }
};

export const RobotWizardStep2: React.FC<RobotWizardStep2Props> = ({
  data,
  onNext,
  onBack,
  strategy,
  symbol
}) => {
  const [selectedRiskLevel, setSelectedRiskLevel] = React.useState<'LOW' | 'MEDIUM' | 'HIGH'>(data.riskLevel || 'MEDIUM');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step2Data>({
    defaultValues: data
  });

  const watchedValues = watch();

  // Get strategy recommendations
  const strategyRec = STRATEGY_RECOMMENDATIONS[strategy as keyof typeof STRATEGY_RECOMMENDATIONS];

  // Auto-fill based on risk level selection
  React.useEffect(() => {
    if (selectedRiskLevel) {
      const riskInfo = RISK_LEVELS.find(r => r.id === selectedRiskLevel);
      if (riskInfo) {
        setValue('maxLotSize', riskInfo.recommendedLot);
        setValue('stopLoss', strategyRec?.defaultSL || riskInfo.recommendedSL);
        setValue('takeProfit', strategyRec?.defaultTP || riskInfo.recommendedTP);
      }
    }
  }, [selectedRiskLevel, setValue, strategyRec]);

  const onSubmit = (formData: Step2Data) => {
    onNext({
      ...formData,
      riskLevel: selectedRiskLevel
    });
  };

  // Calculate risk metrics
  const calculateRisk = () => {
    if (!watchedValues.maxLotSize || !watchedValues.stopLoss) return null;
    
    const pipValue = symbol.includes('JPY') || symbol.includes('XAU') || symbol.includes('XAG') ? 0.01 : 0.0001;
    const riskPerLot = watchedValues.stopLoss * pipValue * 100000; // Approximate risk per standard lot
    const totalRisk = watchedValues.maxLotSize * riskPerLot;
    
    return {
      riskPerLot,
      totalRisk,
      riskRewardRatio: watchedValues.takeProfit / watchedValues.stopLoss
    };
  };

  const riskMetrics = calculateRisk();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Strategy Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-medium mb-2">Strategy: {strategy}</h3>
        <p className="text-blue-700 text-sm">
          {strategyRec?.description || 'Configure risk parameters for your trading strategy'}
        </p>
      </div>

      {/* Risk Level Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Risk Profile
        </label>
        <div className="grid grid-cols-1 gap-3">
          {RISK_LEVELS.map((risk) => {
            const Icon = risk.icon;
            const isSelected = selectedRiskLevel === risk.id;
            
            return (
              <label
                key={risk.id}
                className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? `border-${risk.color}-500 bg-${risk.color}-50`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  value={risk.id}
                  checked={selectedRiskLevel === risk.id}
                  onChange={() => setSelectedRiskLevel(risk.id as 'LOW' | 'MEDIUM' | 'HIGH')}
                  className="sr-only"
                />
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? `bg-${risk.color}-100`
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isSelected
                      ? `text-${risk.color}-600`
                      : 'text-gray-500'
                  }`} />
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {risk.name}
                  </p>
                  <p className={`text-xs ${
                    isSelected ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {risk.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {risk.characteristics.map((char, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          isSelected
                            ? `bg-${risk.color}-100 text-${risk.color}-700`
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div className={`w-5 h-5 rounded-full bg-${risk.color}-500 flex items-center justify-center`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </label>
            );
          })}
        </div>
        
        {!selectedRiskLevel && (
          <p className="text-red-500 text-sm mt-1">Please select a risk profile</p>
        )}
      </div>

      {/* Trading Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Lot Size
          </label>
          <div className="relative">
            <input
              {...register('maxLotSize', { 
                required: 'Max lot size is required',
                min: { value: 0.01, message: 'Minimum 0.01' },
                max: { value: 100, message: 'Maximum 100' }
              })}
              type="number"
              step="0.01"
              placeholder="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calculator className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {errors.maxLotSize && (
            <p className="text-red-500 text-sm mt-1">{errors.maxLotSize.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Maximum position size per trade
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stop Loss (pips)
          </label>
          <input
            {...register('stopLoss', { 
              required: 'Stop loss is required',
              min: { value: 1, message: 'Minimum 1 pip' }
            })}
            type="number"
            placeholder="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.stopLoss && (
            <p className="text-red-500 text-sm mt-1">{errors.stopLoss.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Maximum loss per trade
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Take Profit (pips)
          </label>
          <input
            {...register('takeProfit', { 
              required: 'Take profit is required',
              min: { value: 1, message: 'Minimum 1 pip' }
            })}
            type="number"
            placeholder="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.takeProfit && (
            <p className="text-red-500 text-sm mt-1">{errors.takeProfit.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Target profit per trade
          </p>
        </div>
      </div>

      {/* Risk Metrics */}
      {riskMetrics && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-gray-800 font-medium mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Risk Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Risk/Reward Ratio</p>
              <p className={`font-semibold ${
                riskMetrics.riskRewardRatio >= 2 ? 'text-green-600' : 
                riskMetrics.riskRewardRatio >= 1.5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                1:{riskMetrics.riskRewardRatio.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Max Risk per Trade</p>
              <p className="font-semibold text-gray-900">
                ${riskMetrics.totalRisk.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Strategy Fit</p>
              <p className="font-semibold text-blue-600">
                {strategy}
              </p>
            </div>
          </div>
          
          {riskMetrics.riskRewardRatio < 1.5 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Risk/Reward Warning</p>
                  <p className="text-yellow-700 text-xs">
                    Consider increasing take profit or decreasing stop loss for better risk/reward ratio
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!selectedRiskLevel}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Review & Create
        </button>
      </div>
    </form>
  );
};