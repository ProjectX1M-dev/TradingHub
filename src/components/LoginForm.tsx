import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, TrendingUp, Building, User, Key } from 'lucide-react';
import { MT5Credentials } from '../types/mt5';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const DEMO_SERVERS = [
  'RoboForex-ECN',
  'ACGMarkets-Main',
  'Alpari-MT5-Demo',
  'FXCM-USDDemo01',
  'ICMarkets-Demo02'
];

const ACCOUNT_TYPES = [
  {
    id: 'live',
    label: 'Live Account',
    description: 'Real money trading account (normal symbols)',
    icon: TrendingUp,
    color: 'green'
  },
  {
    id: 'prop',
    label: 'Prop Account',
    description: 'Proprietary trading firm account with funded capital (uses .raw symbols)',
    icon: Building,
    color: 'purple'
  }
] as const;

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MT5Credentials>({
    defaultValues: {
      accountType: 'live'
    }
  });

  const selectedAccountType = watch('accountType');

  const onSubmit = async (data: MT5Credentials) => {
    try {
      clearError();
      await login(data);
      
      const accountTypeLabel = ACCOUNT_TYPES.find(type => type.id === data.accountType)?.label || data.accountType;
      toast.success(`Successfully connected to MT5 ${accountTypeLabel}!`);
    } catch (error) {
      toast.error('Failed to connect to MT5 or authenticate');
    }
  };

  const getAccountTypeInfo = (type: string) => {
    return ACCOUNT_TYPES.find(accountType => accountType.id === type);
  };

  const selectedTypeInfo = getAccountTypeInfo(selectedAccountType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MT5 Trading Platform</h1>
          <p className="text-gray-600 mt-2">Connect to your MetaTrader 5 account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Platform Account Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-800">Platform Account</h3>
            </div>
            <p className="text-xs text-blue-700 mb-4">
              Enter your trading platform credentials (used to access this application)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Email Address
                </label>
                <input
                  {...register('email', { 
                    required: 'Platform email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  placeholder="Your platform account email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Platform password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your platform account password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* MT5 Account Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Key className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-green-800">MT5 Account Details</h3>
            </div>
            <p className="text-xs text-green-700 mb-4">
              Enter your MetaTrader 5 broker account credentials
            </p>

            <div className="space-y-4">
              {/* Account Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  MT5 Account Type
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {ACCOUNT_TYPES.map((accountType) => {
                    const Icon = accountType.icon;
                    const isSelected = selectedAccountType === accountType.id;
                    
                    return (
                      <label
                        key={accountType.id}
                        className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? `border-${accountType.color}-500 bg-${accountType.color}-50`
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          {...register('accountType', { required: 'Account type is required' })}
                          type="radio"
                          value={accountType.id}
                          className="sr-only"
                          onChange={() => setValue('accountType', accountType.id as any)}
                        />
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? `bg-${accountType.color}-100`
                            : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected
                              ? `text-${accountType.color}-600`
                              : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className={`text-sm font-medium ${
                            isSelected ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {accountType.label}
                          </p>
                          <p className={`text-xs ${
                            isSelected ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {accountType.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className={`w-5 h-5 rounded-full bg-${accountType.color}-500 flex items-center justify-center`}>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                {errors.accountType && (
                  <p className="text-red-500 text-sm mt-1">{errors.accountType.message}</p>
                )}
              </div>

              {/* Account Type Info */}
              {selectedTypeInfo && (
                <div className={`p-4 rounded-lg border border-${selectedTypeInfo.color}-200 bg-${selectedTypeInfo.color}-50`}>
                  <div className="flex items-start space-x-3">
                    <selectedTypeInfo.icon className={`w-5 h-5 text-${selectedTypeInfo.color}-600 flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className={`text-${selectedTypeInfo.color}-800 text-sm font-medium`}>
                        {selectedTypeInfo.label} Selected
                      </p>
                      <div className={`text-${selectedTypeInfo.color}-700 text-xs mt-1 space-y-1`}>
                        {selectedAccountType === 'live' && (
                          <>
                            <p>• Uses normal symbols (e.g., EURUSD)</p>
                            <p>• Real money trading with all features active</p>
                            <p>• Use with caution and proper risk management</p>
                          </>
                        )}
                        {selectedAccountType === 'prop' && (
                          <>
                            <p>• Uses symbols with .raw extension (e.g., EURUSD.raw)</p>
                            <p>• Funded account from proprietary trading firm</p>
                            <p>• Specific rules and risk management requirements</p>
                            <p>• Profit sharing with the funding company</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MT5 Account Number
                </label>
                <input
                  {...register('username', { 
                    required: 'MT5 account number is required',
                    pattern: {
                      value: /^\d+$/,
                      message: 'Account number must contain only digits'
                    }
                  })}
                  type="text"
                  placeholder="Your MT5 broker account number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MT5 Server
                </label>
                <select
                  {...register('server', { required: 'MT5 server is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select your broker's MT5 server</option>
                  {DEMO_SERVERS.map(server => (
                    <option key={server} value={server}>{server}</option>
                  ))}
                </select>
                {errors.server && (
                  <p className="text-red-500 text-sm mt-1">{errors.server.message}</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 text-sm font-medium">Authentication Failed</p>
                <p className="text-red-700 text-sm mt-1">
                  {error.includes('Invalid login credentials') 
                    ? 'Invalid platform credentials. Please check your platform email and password.'
                    : error
                  }
                </p>
                <p className="text-red-600 text-xs mt-2">
                  Make sure you're using your platform account credentials, not your MT5 broker credentials.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              `Connect to Platform & MT5 ${selectedTypeInfo?.label || ''}`
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Secure connection to both platform and MetaTrader 5 servers
          </p>
        </div>
      </div>
    </div>
  );
};