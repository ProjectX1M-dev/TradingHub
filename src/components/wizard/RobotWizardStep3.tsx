import React from 'react';
import { CheckCircle, Bot, Target, Shield, Settings, AlertTriangle } from 'lucide-react';

interface Step3Data {
  isActive: boolean;
}

interface RobotWizardStep3Props {
  data: Step3Data;
  onSubmit: (data: Step3Data) => void;
  onBack: () => void;
  formData: {
    name: string;
    symbol: string;
    strategy: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    maxLotSize: number;
    stopLoss: number;
    takeProfit: number;
  };
  isCreating: boolean;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'LOW': return 'text-green-600 bg-green-100';
    case 'MEDIUM': return 'text-blue-600 bg-blue-100';
    case 'HIGH': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const RobotWizardStep3: React.FC<RobotWizardStep3Props> = ({
  data,
  onSubmit,
  onBack,
  formData,
  isCreating
}) => {
  const [isActive, setIsActive] = React.useState(data.isActive || false);

  const handleSubmit = () => {
    onSubmit({ isActive });
  };

  // Calculate risk metrics for display
  const pipValue = formData.symbol.includes('JPY') || formData.symbol.includes('XAU') || formData.symbol.includes('XAG') ? 0.01 : 0.0001;
  const riskPerTrade = formData.maxLotSize * formData.stopLoss * pipValue * 100000;
  const riskRewardRatio = formData.takeProfit / formData.stopLoss;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Review Your Robot</h3>
        <p className="text-gray-600 mt-1">
          Verify all settings before creating your trading robot
        </p>
      </div>

      {/* Robot Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900">{formData.name}</h4>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{formData.symbol}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-700">{formData.strategy}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(formData.riskLevel)}`}>
                {formData.riskLevel} RISK
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trading Parameters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Trading Parameters
          </h5>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Max Lot Size:</span>
              <span className="font-medium">{formData.maxLotSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stop Loss:</span>
              <span className="font-medium">{formData.stopLoss} pips</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Take Profit:</span>
              <span className="font-medium">{formData.takeProfit} pips</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Risk/Reward:</span>
              <span className={`font-medium ${
                riskRewardRatio >= 2 ? 'text-green-600' : 
                riskRewardRatio >= 1.5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                1:{riskRewardRatio.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Risk Analysis
          </h5>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Risk Profile:</span>
              <span className={`font-medium ${
                formData.riskLevel === 'LOW' ? 'text-green-600' :
                formData.riskLevel === 'MEDIUM' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {formData.riskLevel === 'LOW' ? 'Conservative' :
                 formData.riskLevel === 'MEDIUM' ? 'Balanced' : 'Aggressive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Risk/Trade:</span>
              <span className="font-medium">${riskPerTrade.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Strategy:</span>
              <span className="font-medium">{formData.strategy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Symbol Type:</span>
              <span className="font-medium">
                {formData.symbol.includes('JPY') ? 'JPY Pair' :
                 formData.symbol.includes('XAU') ? 'Gold' :
                 formData.symbol.includes('XAG') ? 'Silver' : 'Major Pair'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activation Option */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="text-yellow-800 font-medium">Robot Activation</h5>
            <p className="text-yellow-700 text-sm mt-1">
              Choose whether to activate your robot immediately after creation. 
              You can always change this later from the dashboard.
            </p>
            <div className="mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-yellow-800">
                  Start robot immediately after creation
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-blue-800 font-medium mb-2">📋 What happens next?</h5>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Your robot will be created with a unique bot token for TradingView integration</li>
          <li>• You'll receive the exact JSON payload for your TradingView alerts</li>
          <li>• The robot will use enhanced pip calculation for accurate SL/TP</li>
          <li>• All trades will be executed automatically when signals are received</li>
          {isActive && <li>• <strong>Robot will be ACTIVE and ready to trade immediately</strong></li>}
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isCreating}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isCreating}
          className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isCreating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Robot...</span>
            </div>
          ) : (
            'Create Robot'
          )}
        </button>
      </div>
    </div>
  );
};