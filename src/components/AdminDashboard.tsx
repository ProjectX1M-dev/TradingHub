import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../stores/adminStore';
import { Users, Wallet, TrendingUp, Shield, Search, Filter, Eye, UserPlus, DollarSign, Plus, LogOut, Package, RefreshCw, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { AdminPlugins } from './AdminPlugins';
import { AdminPromoCodes } from './AdminPromoCodes';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { 
    adminUsers, 
    currentAdmin, 
    fetchAllUsersWithTokens, 
    addTokensToUser, 
    logout,
    isLoading 
  } = useAdminStore();
  
  const [activeTab, setActiveTab] = useState<'users' | 'plugins' | 'promo-codes'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-tokens' | 'without-tokens'>('all');
  const [showAddTokensModal, setShowAddTokensModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<number>(100);
  const [tokenDescription, setTokenDescription] = useState<string>('Admin bonus');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllUsersWithTokens();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAllUsersWithTokens();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchAllUsersWithTokens]);

  // Filter users based on search and filter type
  const filteredUsers = adminUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'with-tokens' && user.tokens !== null) ||
                         (filterType === 'without-tokens' && user.tokens === null);
    
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const totalUsers = adminUsers.length;
  const usersWithTokens = adminUsers.filter(u => u.tokens !== null).length;
  const totalTokensInCirculation = adminUsers.reduce((sum, user) => 
    sum + (user.tokens?.balance || 0), 0
  );
  const totalTokensEarned = adminUsers.reduce((sum, user) => 
    sum + (user.tokens?.earned || 0), 0
  );
  const totalTokensSpent = adminUsers.reduce((sum, user) => 
    sum + (user.tokens?.spent || 0), 0
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddTokens = async () => {
    if (!selectedUserId || tokenAmount <= 0) {
      toast.error('Please enter a valid token amount');
      return;
    }

    const success = await addTokensToUser(selectedUserId, tokenAmount, tokenDescription);
    if (success) {
      setShowAddTokensModal(false);
      setSelectedUserId(null);
      setSelectedUserEmail('');
      setTokenAmount(100);
      setTokenDescription('Admin bonus');
    }
  };

  const openAddTokensModal = (userId: string, userEmail: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(userEmail);
    setShowAddTokensModal(true);
  };

  const handleRefreshUsers = async () => {
    setIsRefreshing(true);
    await fetchAllUsersWithTokens();
    setIsRefreshing(false);
    toast.success('User data refreshed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Admin Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-purple-200">Welcome, {currentAdmin?.username}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-purple-200">Role</p>
                <p className="text-white font-medium capitalize">{currentAdmin?.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-4 py-2 text-purple-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Main App</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-purple-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-purple-200 hover:text-white hover:border-white/30'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </button>
            <button
              onClick={() => setActiveTab('plugins')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'plugins'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-purple-200 hover:text-white hover:border-white/30'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Plugins</span>
            </button>
            <button
              onClick={() => setActiveTab('promo-codes')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'promo-codes'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-purple-200 hover:text-white hover:border-white/30'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Promo Codes</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-blue-200 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
                <p className="text-xs text-blue-200">{usersWithTokens} with tokens</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <p className="text-sm text-green-200 font-medium">Tokens in Circulation</p>
                <p className="text-2xl font-bold text-white">{totalTokensInCirculation.toLocaleString()}</p>
                <p className="text-xs text-green-200">Current balances</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <p className="text-sm text-purple-200 font-medium">Total Earned</p>
                <p className="text-2xl font-bold text-white">{totalTokensEarned.toLocaleString()}</p>
                <p className="text-xs text-purple-200">All time</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500/20 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-300" />
              </div>
              <div>
                <p className="text-sm text-orange-200 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-white">{totalTokensSpent.toLocaleString()}</p>
                <p className="text-xs text-orange-200">All time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">User Management</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefreshUsers}
                    disabled={isRefreshing}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh Users'}</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-purple-300" />
                    <span className="text-sm text-purple-200">
                      {filteredUsers.length} of {totalUsers} users
                    </span>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by email or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-purple-300" />
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        filterType === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-purple-200 hover:bg-white/20'
                      }`}
                    >
                      All Users
                    </button>
                    <button
                      onClick={() => setFilterType('with-tokens')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        filterType === 'with-tokens'
                          ? 'bg-green-600 text-white'
                          : 'bg-white/10 text-green-200 hover:bg-white/20'
                      }`}
                    >
                      With Tokens
                    </button>
                    <button
                      onClick={() => setFilterType('without-tokens')}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        filterType === 'without-tokens'
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-red-200 hover:bg-white/20'
                      }`}
                    >
                      No Tokens
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-purple-200">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <p className="text-purple-200">No users found</p>
                <p className="text-sm text-purple-300 mt-1">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Users will appear here when they sign up'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                        Token Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                        Earned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                        Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-white">{user.email}</p>
                            <p className="text-sm text-purple-300 font-mono">{user.id.substring(0, 8)}...</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.tokens ? (
                            <span className="text-lg font-semibold text-white">
                              {user.tokens.balance.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-purple-400">No tokens</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.tokens ? (
                            <span className="text-green-300 font-medium">
                              {user.tokens.earned.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-purple-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.tokens ? (
                            <span className="text-red-300 font-medium">
                              {user.tokens.spent.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-purple-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                          {user.last_sign_in_at ? (
                            formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                          ) : (
                            'Never'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openAddTokensModal(user.id, user.email)}
                              className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title={`Add tokens to ${user.email}`}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Tokens
                            </button>
                            <button
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              title={`View details for ${user.email}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plugins' && <AdminPlugins />}
        
        {activeTab === 'promo-codes' && <AdminPromoCodes />}
      </div>

      {/* Add Tokens Modal */}
      {showAddTokensModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Tokens to User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{selectedUserEmail}</p>
                  <p className="text-xs text-gray-500 font-mono">{selectedUserId}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Amount
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={tokenDescription}
                  onChange={(e) => setTokenDescription(e.target.value)}
                  placeholder="Reason for adding tokens"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddTokens}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Tokens
              </button>
              <button
                onClick={() => {
                  setShowAddTokensModal(false);
                  setSelectedUserId(null);
                  setSelectedUserEmail('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
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