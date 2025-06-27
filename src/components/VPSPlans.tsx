import React, { useState } from 'react';
import { VPSPlan, UserTokens } from '../types/vps';
import { Server, Zap, Crown, Shield, Check, X, TrendingUp, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VPSPlansProps {
  userTokens: UserTokens;
  onPurchasePlan: (planId: string) => Promise<boolean>;
  onBackToChoice: () => void;
}

const VPS_PLANS: VPSPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic trading in your browser',
    tokenCost: 0,
    duration: 'lifetime',
    isActive: true,
    features: [
      { id: 'manual-trading', name: 'Manual Trading', description: 'Execute trades manually', enabled: true },
      { id: 'basic-robots', name: 'Basic Robots', description: 'Up to 3 simple robots', enabled: true },
      { id: 'browser-only', name: 'Browser Only', description: 'Works only when browser is open', enabled: true }
    ],
    limits: {
      maxRobots: 3,
      maxPositions: 10,
      trailingStops: false,
      advancedRiskManagement: false,
      priorityExecution: false,
      customAlgorithms: false,
      apiAccess: false,
      notifications: ['email']
    }
  },
  {
    id: 'vps-basic',
    name: 'VPS Basic',
    description: '24/7 server-side trading',
    tokenCost: 100,
    duration: 'monthly',
    isActive: true,
    features: [
      { id: 'server-trading', name: '24/7 Server Trading', description: 'Trades execute even when offline', enabled: true },
      { id: 'trailing-stops', name: 'Trailing Stops', description: 'Basic trailing stop functionality', enabled: true },
      { id: 'more-robots', name: 'More Robots', description: 'Up to 10 active robots', enabled: true },
      { id: 'notifications', name: 'Notifications', description: 'Email + SMS alerts', enabled: true }
    ],
    limits: {
      maxRobots: 10,
      maxPositions: 50,
      trailingStops: true,
      advancedRiskManagement: true,
      priorityExecution: false,
      customAlgorithms: false,
      apiAccess: false,
      notifications: ['email', 'sms']
    }
  },
  {
    id: 'vps-pro',
    name: 'VPS Pro',
    description: 'Advanced trading features',
    tokenCost: 250,
    duration: 'monthly',
    isActive: true,
    features: [
      { id: 'advanced-trailing', name: 'Advanced Trailing Stops', description: 'Multiple trailing algorithms', enabled: true },
      { id: 'unlimited-robots', name: 'More Robots', description: 'Up to 50 active robots', enabled: true },
      { id: 'priority-execution', name: 'Priority Execution', description: 'Faster trade execution', enabled: true },
      { id: 'advanced-risk', name: 'Advanced Risk Management', description: 'Portfolio-level risk controls', enabled: true }
    ],
    limits: {
      maxRobots: 50,
      maxPositions: 200,
      trailingStops: true,
      advancedRiskManagement: true,
      priorityExecution: true,
      customAlgorithms: true,
      apiAccess: false,
      notifications: ['email', 'sms', 'webhook']
    }
  },
  {
    id: 'vps-enterprise',
    name: 'VPS Enterprise',
    description: 'Institutional-grade platform',
    tokenCost: 500,
    duration: 'monthly',
    isActive: true,
    features: [
      { id: 'unlimited-everything', name: 'Unlimited Everything', description: 'No limits on robots or positions', enabled: true },
      { id: 'custom-algorithms', name: 'Custom Algorithms', description: 'Build your own trading algorithms', enabled: true },
      { id: 'api-access', name: 'API Access', description: 'Full REST API access', enabled: true },
      { id: 'white-label', name: 'White Label', description: 'Brand the platform as your own', enabled: true }
    ],
    limits: {
      maxRobots: -1, // Unlimited
      maxPositions: -1, // Unlimited
      trailingStops: true,
      advancedRiskManagement: true,
      priorityExecution: true,
      customAlgorithms: true,
      apiAccess: true,
      notifications: ['email', 'sms', 'webhook']
    }
  }
];

export const VPSPlans: React.FC<VPSPlansProps> = ({ userTokens, onPurchasePlan, onBackToChoice }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return Server;
      case 'vps-basic': return Zap;
      case 'vps-pro': return Shield;
      case 'vps-enterprise': return Crown;
      default: return Server;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'gray';
      case 'vps-basic': return 'blue';
      case 'vps-pro': return 'purple';
      case 'vps-enterprise': return 'yellow';
      default: return 'gray';
    }
  };

  const canAfford = (plan: VPSPlan) => {
    return userTokens.balance >= plan.tokenCost;
  };

  const handlePurchase = async (planId: string) => {
    setIsProcessing(true);
    setSelectedPlan(planId);
    
    try {
      const success = await onPurchasePlan(planId);
      if (success) {
        // Optionally redirect or show success state
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple header with just logo and back button */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToChoice}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Trading Hub</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">VPS Hosting Plans</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the full potential of your trading robots with our dedicated server solutions. 
            Trade 24/7 with advanced features like trailing stops and priority execution.
          </p>
        </div>

        {/* Token Balance */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Token Balance</h3>
              <p className="text-gray-600">Use tokens to unlock VPS features and advanced trading capabilities</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{userTokens.balance}</p>
              <p className="text-sm text-gray-500">Available Tokens</p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {VPS_PLANS.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const color = getPlanColor(plan.id);
            const affordable = canAfford(plan);
            const processing = isProcessing && selectedPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative border-2 rounded-xl p-6 transition-all duration-300 ${
                  selectedPlan === plan.id
                    ? `border-${color}-500 bg-${color}-50 shadow-lg scale-105`
                    : `border-gray-200 bg-white hover:border-${color}-300 hover:shadow-md`
                }`}
              >
                {/* Popular Badge */}
                {plan.id === 'vps-pro' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${color}-100 flex items-center justify-center`}>
                    <Icon className={`w-8 h-8 text-${color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                  {plan.tokenCost === 0 ? (
                    <div className="text-2xl font-bold text-gray-900">Free</div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{plan.tokenCost}</div>
                      <div className="text-sm text-gray-500">tokens/{plan.duration}</div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <div key={feature.id} className="flex items-start space-x-2">
                      {feature.enabled ? (
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                        <p className="text-xs text-gray-500">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Max Robots:</span>
                      <span className="font-medium">
                        {plan.limits.maxRobots === -1 ? 'Unlimited' : plan.limits.maxRobots}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Positions:</span>
                      <span className="font-medium">
                        {plan.limits.maxPositions === -1 ? 'Unlimited' : plan.limits.maxPositions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trailing Stops:</span>
                      <span className="font-medium">
                        {plan.limits.trailingStops ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={processing || (plan.tokenCost > 0 && !affordable)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.tokenCost === 0
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : affordable
                      ? `bg-${color}-600 text-white hover:bg-${color}-700 disabled:opacity-50`
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : plan.tokenCost === 0 ? (
                    'Current Plan'
                  ) : affordable ? (
                    `Upgrade for ${plan.tokenCost} tokens`
                  ) : (
                    `Need ${plan.tokenCost - userTokens.balance} more tokens`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Token Purchase Options */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need More Tokens?</h3>
          <p className="text-gray-600 mb-6">Purchase token packages to unlock VPS features and advanced trading capabilities.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">100 Tokens</div>
              <div className="text-sm text-gray-500 mb-3">$9.99</div>
              <button 
                onClick={() => navigate('/packages')}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Purchase
              </button>
            </div>
            <div className="border border-purple-200 rounded-lg p-4 text-center bg-purple-50">
              <div className="text-2xl font-bold text-purple-900">500 Tokens</div>
              <div className="text-sm text-purple-600 mb-1">$39.99</div>
              <div className="text-xs text-purple-600 mb-3">20% Bonus!</div>
              <button 
                onClick={() => navigate('/packages')}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Purchase
              </button>
            </div>
            <div className="border border-yellow-200 rounded-lg p-4 text-center bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-900">1000 Tokens</div>
              <div className="text-sm text-yellow-600 mb-1">$69.99</div>
              <div className="text-xs text-yellow-600 mb-3">30% Bonus!</div>
              <button 
                onClick={() => navigate('/packages')}
                className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Purchase
              </button>
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-12 bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">What You Get with VPS Hosting</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">24/7 Operation</h4>
              <p className="text-sm text-gray-600">Your robots trade continuously, even when your computer is off</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Trailing Stops</h4>
              <p className="text-sm text-gray-600">Advanced trailing stop algorithms to maximize profits</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Priority Execution</h4>
              <p className="text-sm text-gray-600">Faster trade execution with dedicated server resources</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};