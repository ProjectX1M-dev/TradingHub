import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TrendingUp, Building, Key, AlertCircle, ArrowRight, CheckCircle, Plus, HelpCircle, ExternalLink, Lock, ArrowLeft } from 'lucide-react';
import { MT5Credentials } from '../types/mt5';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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
    description: 'Real money trading',
    icon: TrendingUp,
    color: 'green'
  },
  {
    id: 'prop',
    label: 'Prop Account',
    description: 'Funded trading account',
    icon: Building,
    color: 'purple'
  }
] as const;

interface BrokerCredentials {
  username: string;
  password: string;
  server: string;
  accountType: 'live' | 'prop';
  nickname?: string;
}

interface SavedAccount {
  id: string;
  username: string;
  server: string;
  accountType: 'live' | 'prop';
  nickname: string;
  isActive: boolean;
}

interface PasswordPromptModal {
  isOpen: boolean;
  account: SavedAccount | null;
  password: string;
  isConnecting: boolean;
}

export const BrokerSetup: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState<PasswordPromptModal>({
    isOpen: false,
    account: null,
    password: '',
    isConnecting: false
  });
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BrokerCredentials>({
    defaultValues: {
      accountType: 'live',
      nickname: ''
    }
  });

  const selectedAccountType = watch('accountType');

  // Fetch user's saved accounts
  useEffect(() => {
    const fetchSavedAccounts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.id) {
          return;
        }
        
        const { data, error } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('❌ Error fetching saved accounts:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const accounts: SavedAccount[] = data.map(account => ({
            id: account.id,
            username: account.mt5_username,
            server: account.mt5_server,
            accountType: account.account_type as 'live' | 'prop',
            nickname: account.account_name || `${account.account_type} - ${account.mt5_username}`,
            isActive: account.is_active
          }));
          
          setSavedAccounts(accounts);
          setShowAddAccount(false);
        }
      } catch (error) {
        console.error('Error fetching saved accounts:', error);
      }
    };
    
    fetchSavedAccounts();
  }, []);

  const onSubmit = async (data: BrokerCredentials) => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        throw new Error('No authenticated user found');
      }

      // Create MT5 credentials with correct password
      const mt5Credentials: MT5Credentials = {
        email: session.user.email,
        password: data.password, // Use the actual MT5 password from the form
        username: data.username,
        server: data.server,
        accountType: data.accountType,
        nickname: data.nickname
      };

      // Connect to MT5 using the auth store
      const { login } = useAuthStore.getState();
      await login(mt5Credentials);
      
      const accountTypeLabel = ACCOUNT_TYPES.find(type => type.id === data.accountType)?.label || data.accountType;
      toast.success(`Successfully connected to MT5 ${accountTypeLabel}!`);
    } catch (error) {
      console.error('Broker connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to broker';
      setConnectionError(errorMessage);
      toast.error('Failed to connect to MT5 broker');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectAccount = (account: SavedAccount) => {
    // Show password prompt modal
    setPasswordPrompt({
      isOpen: true,
      account: account,
      password: '',
      isConnecting: false
    });
  };

  const handlePasswordSubmit = async () => {
    if (!passwordPrompt.account || !passwordPrompt.password) {
      toast.error('Please enter your MT5 password');
      return;
    }

    setPasswordPrompt(prev => ({ ...prev, isConnecting: true }));
    setConnectionError(null);
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        throw new Error('No authenticated user found');
      }

      // First, set this account as active and others as inactive
      await supabase
        .from('user_accounts')
        .update({ is_active: false })
        .eq('user_id', session.user.id);
        
      await supabase
        .from('user_accounts')
        .update({ is_active: true })
        .eq('id', passwordPrompt.account.id);

      // Create MT5 credentials with the provided password
      const mt5Credentials: MT5Credentials = {
        email: session.user.email,
        password: passwordPrompt.password, // Use the actual MT5 password
        username: passwordPrompt.account.username,
        server: passwordPrompt.account.server,
        accountType: passwordPrompt.account.accountType,
        nickname: passwordPrompt.account.nickname
      };

      // Connect to MT5 using the auth store
      const { login } = useAuthStore.getState();
      await login(mt5Credentials);
      
      toast.success(`Successfully connected to ${passwordPrompt.account.nickname}!`);
      
      // Update local state
      setSavedAccounts(prev => 
        prev.map(acc => ({
          ...acc,
          isActive: acc.id === passwordPrompt.account!.id
        }))
      );

      // Close the password prompt
      setPasswordPrompt({
        isOpen: false,
        account: null,
        password: '',
        isConnecting: false
      });
    } catch (error) {
      console.error('Account selection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to broker';
      setConnectionError(errorMessage);
      toast.error('Failed to connect to selected account');
    } finally {
      setPasswordPrompt(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const handleClosePasswordPrompt = () => {
    setPasswordPrompt({
      isOpen: false,
      account: null,
      password: '',
      isConnecting: false
    });
  };

  // Helper function to determine if error is credential-related
  const isCredentialError = (error: string) => {
    const lowerError = error.toLowerCase();
    return lowerError.includes('invalid account') || 
           lowerError.includes('invalid_account') ||
           lowerError.includes('invalid password') ||
           lowerError.includes('invalid_password') ||
           lowerError.includes('invalid server') ||
           lowerError.includes('invalid_server') ||
           lowerError.includes('authentication failed') ||
           lowerError.includes('login failed') ||
           lowerError.includes('incorrect') ||
           lowerError.includes('wrong');
  };

  const getAccountTypeInfo = (type: string) => {
    return ACCOUNT_TYPES.find(accountType => accountType.id === type);
  };

  const selectedTypeInfo = getAccountTypeInfo(selectedAccountType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connect Your Broker</h1>
          <p className="text-gray-600 mt-2">Add your MT5 broker account to start trading</p>
        </div>

        {/* Saved Accounts Section */}
        {savedAccounts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Accounts</h2>
              <button
                onClick={() => setShowAddAccount(!showAddAccount)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                {showAddAccount ? 'Hide' : 'Add New Account'}
              </button>
            </div>
            
            <div className="space-y-3">
              {savedAccounts.map(account => {
                const accountTypeInfo = getAccountTypeInfo(account.accountType);
                const AccountIcon = accountTypeInfo?.icon || TrendingUp;
                
                return (
                  <div 
                    key={account.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      account.isActive 
                        ? `border-${accountTypeInfo?.color || 'blue'}-500 bg-${accountTypeInfo?.color || 'blue'}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectAccount(account)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          account.isActive
                            ? `bg-${accountTypeInfo?.color || 'blue'}-100`
                            : 'bg-gray-100'
                        }`}>
                          <AccountIcon className={`w-5 h-5 ${
                            account.isActive
                              ? `text-${accountTypeInfo?.color || 'blue'}-600`
                              : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{account.nickname}</p>
                          <p className="text-sm text-gray-500">
                            {account.username} • {account.server}
                          </p>
                        </div>
                      </div>
                      {account.isActive && (
                        <div className={`p-1 rounded-full bg-${accountTypeInfo?.color || 'blue'}-500`}>
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add New Account Form */}
        {(showAddAccount || savedAccounts.length === 0) && (
          <>
            {savedAccounts.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Add New Account
                </h2>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Account Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Type
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
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
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
                            <p>• Uses standard symbols (e.g., EURUSD)</p>
                            <p>• Real money trading with full features</p>
                          </>
                        )}
                        {selectedAccountType === 'prop' && (
                          <>
                            <p>• Uses .raw symbols (e.g., EURUSD.raw)</p>
                            <p>• Funded account with profit sharing</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Nickname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Nickname (Optional)
                </label>
                <input
                  {...register('nickname')}
                  type="text"
                  placeholder="e.g., My Live Account"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A friendly name to identify this account
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MT5 Account Number
                </label>
                <input
                  {...register('username', { 
                    required: 'Account number is required',
                    pattern: {
                      value: /^\d+$/,
                      message: 'Account number must contain only digits'
                    }
                  })}
                  type="text"
                  placeholder="Your broker account number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MT5 Password
                </label>
                <input
                  {...register('password', { required: 'Password is required' })}
                  type="password"
                  placeholder="Your broker account password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MT5 Server
                </label>
                <select
                  {...register('server', { required: 'Server is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select your broker's server</option>
                  {DEMO_SERVERS.map(server => (
                    <option key={server} value={server}>{server}</option>
                  ))}
                </select>
                {errors.server && (
                  <p className="text-red-500 text-sm mt-1">{errors.server.message}</p>
                )}
              </div>

              {/* Enhanced Error Display */}
              {connectionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-800 text-sm font-medium">Connection Failed</p>
                      <p className="text-red-700 text-sm mt-1">{connectionError}</p>
                      
                      {/* Show helpful tips for credential errors */}
                      {isCredentialError(connectionError) && (
                        <div className="mt-3 p-3 bg-red-100 rounded-md">
                          <p className="text-red-800 text-xs font-medium mb-2">💡 Troubleshooting Tips:</p>
                          <ul className="text-red-700 text-xs space-y-1">
                            <li>• Double-check your account number (no spaces or special characters)</li>
                            <li>• Verify your password is correct</li>
                            <li>• Ensure you selected the right server for your broker</li>
                            <li>• Make sure your account is active and not suspended</li>
                            <li>• Try logging into MT5 desktop app first to verify credentials</li>
                          </ul>
                          <button
                            type="button"
                            onClick={() => setShowHelp(!showHelp)}
                            className="mt-2 text-red-600 hover:text-red-700 text-xs flex items-center space-x-1"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>{showHelp ? 'Hide' : 'Show'} detailed help</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Help Section */}
              {showHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-800 text-sm font-medium mb-2">How to find your MT5 credentials:</p>
                      <div className="text-blue-700 text-xs space-y-2">
                        <div>
                          <p className="font-medium">Account Number:</p>
                          <p>• Found in your broker's welcome email</p>
                          <p>• Visible in MT5 desktop app under "Navigator" → "Accounts"</p>
                          <p>• Usually 6-8 digits (e.g., 12345678)</p>
                        </div>
                        <div>
                          <p className="font-medium">Password:</p>
                          <p>• The password you use to log into MT5</p>
                          <p>• If forgotten, contact your broker to reset</p>
                        </div>
                        <div>
                          <p className="font-medium">Server:</p>
                          <p>• Found in your broker's setup instructions</p>
                          <p>• Visible in MT5 when connecting</p>
                          <p>• Format: BrokerName-ServerType (e.g., RoboForex-ECN)</p>
                        </div>
                      </div>
                      <a
                        href="https://www.metatrader5.com/en/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Download MT5 to verify credentials</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isConnecting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Connect Broker</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your broker credentials are securely stored and encrypted
          </p>
          <Link 
            to="/login" 
            className="mt-4 inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login Page</span>
          </Link>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Need to create a new account? <Link to="/login" className="text-blue-600 hover:text-blue-700">Sign up here</Link>
          </p>
        </div>
      </div>

      {/* Password Prompt Modal */}
      {passwordPrompt.isOpen && passwordPrompt.account && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Enter MT5 Password</h2>
              <p className="text-gray-600 mt-2">
                Please enter your MT5 password for account: <br />
                <span className="font-medium">{passwordPrompt.account.nickname}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MT5 Password
                </label>
                <input
                  type="password"
                  value={passwordPrompt.password}
                  onChange={(e) => setPasswordPrompt(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your MT5 account password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit();
                    }
                  }}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClosePasswordPrompt}
                  disabled={passwordPrompt.isConnecting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={passwordPrompt.isConnecting || !passwordPrompt.password}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {passwordPrompt.isConnecting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};