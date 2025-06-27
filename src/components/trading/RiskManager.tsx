import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTradingStore } from '../../stores/tradingStore';
import { Shield, AlertTriangle, TrendingUp, DollarSign, Percent } from 'lucide-react';

export const RiskManager: React.FC = () => {
  const { accountInfo } = useAuthStore();
  const { positions } = useTradingStore();
  
  const [riskSettings, setRiskSettings] = useState({
    maxRiskPerTrade: 2,
    maxDailyLoss: 5,
    maxDrawdown: 10,
    maxPositions: 10,
    maxLotSize: 1.0,
    stopLossRequired: true,
    takeProfitRequired: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountInfo?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate current risk metrics
  const currentMetrics = {
    totalExposure: positions.reduce((sum, pos) => sum + (pos.volume * 100000), 0), // Assuming standard lot size
    totalProfit: positions.reduce((sum, pos) => sum + pos.profit, 0),
    openPositions: positions.length,
    maxLossPosition: Math.min(...positions.map(p => p.profit), 0),
    maxProfitPosition: Math.max(...positions.map(p => p.profit), 0),
  };

  const riskPercentage = accountInfo ? (Math.abs(currentMetrics.totalProfit) / accountInfo.balance) * 100 : 0;
  const exposurePercentage = accountInfo ? (currentMetrics.totalExposure / accountInfo.balance) * 100 : 0;

  const getRiskLevel = (percentage: number) => {
    if (percentage < 2) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage < 5) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const currentRiskLevel = getRiskLevel(riskPercentage);

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${currentRiskLevel.bg}`}>
              <Shield className={`w-5 h-5 ${currentRiskLevel.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Risk Level</p>
              <p className={`text-lg font-bold ${currentRiskLevel.color}`}>
                {currentRiskLevel.level}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Percent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Risk</p>
              <p className="text-lg font-bold text-gray-900">
                {riskPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Exposure</p>
              <p className="text-lg font-bold text-gray-900">
                {exposurePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              currentMetrics.totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                currentMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total P&L</p>
              <p className={`text-lg font-bold ${
                currentMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(currentMetrics.totalProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Risk Management Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Risk Per Trade (%)
            </label>
            <input
              type="number"
              value={riskSettings.maxRiskPerTrade}
              onChange={(e) => setRiskSettings(prev => ({
                ...prev,
                maxRiskPerTrade: parseFloat(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Daily Loss (%)
            </label>
            <input
              type="number"
              value={riskSettings.maxDailyLoss}
              onChange={(e) => setRiskSettings(prev => ({
                ...prev,
                maxDailyLoss: parseFloat(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="20"
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Drawdown (%)
            </label>
            <input
              type="number"
              value={riskSettings.maxDrawdown}
              onChange={(e) => setRiskSettings(prev => ({
                ...prev,
                maxDrawdown: parseFloat(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="5"
              max="50"
              step="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Open Positions
            </label>
            <input
              type="number"
              value={riskSettings.maxPositions}
              onChange={(e) => setRiskSettings(prev => ({
                ...prev,
                maxPositions: parseInt(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Lot Size
            </label>
            <input
              type="number"
              value={riskSettings.maxLotSize}
              onChange={(e) => setRiskSettings(prev => ({
                ...prev,
                maxLotSize: parseFloat(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0.01"
              max="100"
              step="0.01"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="stopLossRequired"
                checked={riskSettings.stopLossRequired}
                onChange={(e) => setRiskSettings(prev => ({
                  ...prev,
                  stopLossRequired: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="stopLossRequired" className="ml-2 text-sm text-gray-700">
                Require Stop Loss on all trades
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="takeProfitRequired"
                checked={riskSettings.takeProfitRequired}
                onChange={(e) => setRiskSettings(prev => ({
                  ...prev,
                  takeProfitRequired: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="takeProfitRequired" className="ml-2 text-sm text-gray-700">
                Require Take Profit on all trades
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Risk Settings
          </button>
        </div>
      </div>

      {/* Risk Warnings */}
      <div className="space-y-4">
        {riskPercentage > riskSettings.maxRiskPerTrade && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">High Risk Warning</p>
                <p className="text-red-700 text-sm">
                  Current risk ({riskPercentage.toFixed(2)}%) exceeds your maximum risk per trade setting ({riskSettings.maxRiskPerTrade}%).
                </p>
              </div>
            </div>
          </div>
        )}

        {currentMetrics.openPositions > riskSettings.maxPositions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-medium">Position Limit Exceeded</p>
                <p className="text-yellow-700 text-sm">
                  You have {currentMetrics.openPositions} open positions, which exceeds your limit of {riskSettings.maxPositions}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Position Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Risk Distribution</h4>
            <div className="space-y-2">
              {positions.map((position) => {
                const positionRisk = accountInfo ? (Math.abs(position.profit) / accountInfo.balance) * 100 : 0;
                return (
                  <div key={position.ticket} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{position.symbol}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            positionRisk < 1 ? 'bg-green-500' : 
                            positionRisk < 2 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(positionRisk * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{positionRisk.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Risk Recommendations</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p className="text-gray-700">
                  Consider reducing position sizes to stay within {riskSettings.maxRiskPerTrade}% risk per trade
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-gray-700">
                  Diversify across different currency pairs to reduce correlation risk
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">
                  Set stop losses on all positions to limit potential losses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};