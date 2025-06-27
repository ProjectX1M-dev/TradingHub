import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Header } from './Header';
import { Wallet, TrendingUp, TrendingDown, Clock, Gift, CreditCard, ArrowUpRight, ArrowDownLeft, Package, Bitcoin, Landmark, Trash2, AlertCircle, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  onBackToChoice: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onBackToChoice }) => {
  const { 
    accountInfo, 
    userTokens, 
    userPlugins, 
    fetchUserTokens, 
    fetchUserPlugins, 
    logout 
  } = useAuthStore();
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(100);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTokenStats, setShowTokenStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTokens();
    fetchUserPlugins();
  }, [fetchUserTokens, fetchUserPlugins]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountInfo?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'spent':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'purchased':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'text-green-600';
      case 'spent':
        return 'text-red-600';
      case 'purchased':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleCloseCryptoModal = () => {
    setShowCryptoModal(false);
  };

  const handleBackToHub = () => {
    // Navigate back to the hub/choice screen
    if (onBackToChoice) {
      onBackToChoice();
    } else {
      navigate('/');
    }
  };

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        throw new Error('No authenticated user found');
      }

      // Delete user data from all tables
      await Promise.all([
        // Delete user accounts
        supabase.from('user_accounts').delete().eq('user_id', session.user.id),
        
        // Delete user tokens
        supabase.from('user_tokens').delete().eq('user_id', session.user.id),
        
        // Delete token transactions
        supabase.from('token_transactions').delete().eq('user_id', session.user.id),
        
        // Delete user plugins
        supabase.from('user_plugins').delete().eq('user_id', session.user.id),
        
        // Delete trading robots
        supabase.from('trading_robots').delete().eq('user_id', session.user.id),
        
        // Delete trading signals
        supabase.from('trading_signals').delete().eq('user_id', session.user.id),
        
        // Delete webhook logs
        supabase.from('webhook_logs').delete().eq('user_id', session.user.id),
        
        // Delete VPS subscriptions
        supabase.from('user_vps_subscriptions').delete().eq('user_id', session.user.id),
        
        // Delete VPS instances
        supabase.from('vps_instances').delete().eq('user_id', session.user.id)
      ]);

      // Finally, delete the user account
      const { error } = await supabase.auth.admin.deleteUser(session.user.id);
      
      if (error) {
        // If admin delete fails, try regular delete
        await supabase.auth.signOut();
      }

      toast.success('Your account has been deleted');
      
      // Logout and redirect to login page
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again later.');
    } finally {
      setIsDeleting(false);
      handleCloseDeleteModal();
    }
  };

  const handleBrowsePackages = () => {
    navigate('/packages');
  };

  const toggleTokenStats = () => {
    setShowTokenStats(!showTokenStats);
  };

  if (!userTokens) {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          accountInfo={accountInfo} 
          onBackToChoice={handleBackToHub}
          showBackButton={true}
          currentMode="profile"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        accountInfo={accountInfo} 
        onBackToChoice={handleBackToHub}
        showBackButton={true}
        currentMode="profile"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600">Manage your tokens and view your trading activity</p>
        </div>

        {/* Token Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Current Balance</p>
                <p className="text-2xl font-bold text-blue-800">{userTokens.balance}</p>
                <p className="text-xs text-blue-600">Available Tokens</p>
              </div>
            </div>
            <button 
              onClick={toggleTokenStats}
              className="mt-4 text-sm text-blue-700 hover:text-blue-800 underline"
            >
              {showTokenStats ? "Hide token statistics" : "View token statistics"}
            </button>
          </div>

          {showTokenStats ? (
            <>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <ArrowUpRight className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Earned</p>
                    <p className="text-2xl font-bold text-green-800">{userTokens.earned}</p>
                    <p className="text-xs text-green-600">Lifetime Earnings</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <ArrowDownLeft className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Spent</p>
                    <p className="text-2xl font-bold text-purple-800">{userTokens.spent}</p>
                    <p className="text-xs text-purple-600">Lifetime Spending</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <Package className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Need More Tokens?</p>
                      <p className="text-lg font-medium text-gray-800">Browse Packages</p>
                    </div>
                  </div>
                  <button
                    onClick={handleBrowsePackages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Packages
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <DollarSign className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Token Circulation</p>
                      <p className="text-lg font-medium text-gray-800">In: {userTokens.earned} | Out: {userTokens.spent}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Net Change</p>
                    <p className={`text-lg font-medium ${userTokens.earned - userTokens.spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {userTokens.earned - userTokens.spent}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Active Plugins */}
        {userPlugins.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Plugins</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPlugins.map(plugin => (
                <div key={plugin.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{plugin.name}</p>
                      <p className="text-xs text-purple-600">
                        {plugin.expiresAt ? `Expires ${formatDistanceToNow(new Date(plugin.expiresAt), { addSuffix: true })}` : 'Lifetime access'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{plugin.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Information */}
        {accountInfo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium text-gray-900">{accountInfo.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Server</p>
                <p className="font-medium text-gray-900">{accountInfo.serverName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-medium text-gray-900 capitalize">{accountInfo.accountType || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="font-medium text-gray-900">{formatCurrency(accountInfo.balance)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500 mt-1">Your latest token activity</p>
          </div>

          <div className="divide-y divide-gray-100">
            {userTokens.transactions.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your token transactions will appear here
                </p>
              </div>
            ) : (
              userTokens.transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'earned' ? 'bg-green-100' :
                        transaction.type === 'spent' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                          </span>
                          {transaction.relatedService && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{transaction.relatedService}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'spent' ? '-' : '+'}
                        {transaction.amount} tokens
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Account Management */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Delete Account</p>
                  <p className="text-red-700 text-sm mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleOpenDeleteModal}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token Purchase Options */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need More Tokens?</h3>
          <p className="text-gray-600 mb-6">Purchase token packages to unlock VPS features and advanced trading capabilities.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">100 Tokens</div>
              <div className="text-sm text-gray-500 mb-3">$9.99</div>
              <button 
                onClick={handleBrowsePackages}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Purchase
              </button>
            </div>
            <div className="bg-white border border-purple-200 rounded-lg p-4 text-center bg-purple-50">
              <div className="text-2xl font-bold text-purple-900">500 Tokens</div>
              <div className="text-sm text-purple-600 mb-1">$39.99</div>
              <div className="text-xs text-purple-600 mb-3">20% Bonus!</div>
              <button 
                onClick={handleBrowsePackages}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Purchase
              </button>
            </div>
            <div className="bg-white border border-yellow-200 rounded-lg p-4 text-center bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-900">1000 Tokens</div>
              <div className="text-sm text-yellow-600 mb-1">$69.99</div>
              <div className="text-xs text-yellow-600 mb-3">30% Bonus!</div>
              <button 
                onClick={handleBrowsePackages}
                className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crypto Payment Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Purchase Tokens with Cryptocurrency
            </h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Bitcoin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-medium">Crypto Payment</p>
                    <p className="text-blue-700 text-sm mt-1">
                      Send the exact amount to the address below. Tokens will be automatically credited to your account.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Amount
                </label>
                <select
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={100}>100 Tokens - $9.99</option>
                  <option value={500}>500 Tokens - $39.99 (20% Bonus)</option>
                  <option value={1000}>1000 Tokens - $69.99 (30% Bonus)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-lg p-3 text-center bg-gray-50">
                    <Bitcoin className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-sm font-medium">Bitcoin</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center bg-gray-50">
                    <Landmark className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-sm font-medium">USDT</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Address
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm break-all">
                  bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Send exactly ${purchaseAmount === 100 ? '9.99' : purchaseAmount === 500 ? '39.99' : '69.99'} worth of cryptocurrency to this address
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> After sending payment, tokens will be automatically credited to your account within 10-30 minutes.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseCryptoModal}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-red-600 mb-4">Delete Account</h3>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">Warning: This action cannot be undone</p>
                    <p className="text-red-700 text-sm mt-1">
                      Deleting your account will permanently remove all your data, including:
                    </p>
                    <ul className="text-red-700 text-sm mt-2 space-y-1 list-disc list-inside">
                      <li>All trading accounts and connections</li>
                      <li>Trading robots and signals</li>
                      <li>Token balance and transaction history</li>
                      <li>Purchased plugins and VPS subscriptions</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Permanently Delete Account'
                )}
              </button>
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};