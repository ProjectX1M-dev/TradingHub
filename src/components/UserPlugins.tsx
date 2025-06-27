import React, { useState, useEffect } from 'react';
import { useAuthStore, AVAILABLE_PLUGINS } from '../stores/authStore';
import { Package, Check, AlertCircle, Calendar, DollarSign, Plus, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const UserPlugins: React.FC = () => {
  const { userPlugins, userTokens, fetchUserPlugins, purchasePlugin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);

  useEffect(() => {
    const loadPlugins = async () => {
      setIsLoading(true);
      await fetchUserPlugins();
      setIsLoading(false);
    };
    
    loadPlugins();
  }, [fetchUserPlugins]);

  const handleOpenPurchaseModal = (pluginId: string) => {
    setSelectedPluginId(pluginId);
    setShowPurchaseModal(true);
  };

  const handleClosePurchaseModal = () => {
    setSelectedPluginId(null);
    setShowPurchaseModal(false);
  };

  const handlePurchasePlugin = async () => {
    if (!selectedPluginId) return;
    
    try {
      const success = await purchasePlugin(selectedPluginId);
      if (success) {
        handleClosePurchaseModal();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Failed to purchase plugin');
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Get available plugins that user doesn't already own
  const availableForPurchase = AVAILABLE_PLUGINS.filter(
    plugin => !userPlugins.some(up => up.id === plugin.id)
  );

  return (
    <div className="space-y-8">
      {/* My Plugins Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Plugins</h2>
            <div className="text-sm text-gray-500">
              {userPlugins.length} active plugins
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your plugins...</p>
          </div>
        ) : userPlugins.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">You don't have any plugins yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Purchase plugins to enhance your trading experience
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {userPlugins.map((plugin) => (
              <div key={plugin.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plugin.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {plugin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1">{plugin.description}</p>
                    
                    <div className="flex items-center space-x-4 mt-3 text-sm">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <DollarSign className="w-4 h-4" />
                        <span>{plugin.tokenCost} tokens</span>
                      </div>
                      {plugin.expiresAt && (
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Expires: {formatDate(plugin.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Plugins Section */}
      {availableForPurchase.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Available Plugins</h2>
              <div className="text-sm text-gray-500">
                {availableForPurchase.length} plugins available
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {availableForPurchase.map((plugin) => {
              const canAfford = userTokens && userTokens.balance >= plugin.tokenCost;
              
              return (
                <div key={plugin.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {plugin.tokenCost} tokens
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-1">{plugin.description}</p>
                      
                      {/* Features */}
                      {plugin.features && plugin.features.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Features:</p>
                          <ul className="space-y-1">
                            {plugin.features.map((feature, index) => (
                              <li key={index} className="flex items-start space-x-2 text-sm">
                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <button
                          onClick={() => handleOpenPurchaseModal(plugin.id)}
                          disabled={!canAfford}
                          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            canAfford
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {canAfford
                              ? `Purchase for ${plugin.tokenCost} tokens`
                              : `Need ${plugin.tokenCost - (userTokens?.balance || 0)} more tokens`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPluginId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Purchase</h3>
            
            {(() => {
              const plugin = AVAILABLE_PLUGINS.find(p => p.id === selectedPluginId);
              if (!plugin) return null;
              
              const canAfford = userTokens && userTokens.balance >= plugin.tokenCost;
              
              return (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-purple-800 font-medium">{plugin.name}</p>
                        <p className="text-purple-700 text-sm mt-1">{plugin.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-700">Cost:</div>
                    <div className="font-semibold text-gray-900">{plugin.tokenCost} tokens</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-700">Your balance:</div>
                    <div className="font-semibold text-gray-900">{userTokens?.balance || 0} tokens</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-700">Balance after purchase:</div>
                    <div className={`font-semibold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>
                      {canAfford 
                        ? (userTokens!.balance - plugin.tokenCost) 
                        : `Insufficient (need ${plugin.tokenCost - (userTokens?.balance || 0)} more)`}
                    </div>
                  </div>
                  
                  {!canAfford && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-800 font-medium">Insufficient Tokens</p>
                          <p className="text-red-700 text-sm mt-1">
                            You need {plugin.tokenCost - (userTokens?.balance || 0)} more tokens to purchase this plugin.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-800 font-medium">Plugin Information</p>
                        <p className="text-blue-700 text-sm mt-1">
                          This plugin will be active for 1 year from the date of purchase.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={handlePurchasePlugin}
                      disabled={!canAfford}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        canAfford
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Confirm Purchase
                    </button>
                    <button
                      onClick={handleClosePurchaseModal}
                      className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};