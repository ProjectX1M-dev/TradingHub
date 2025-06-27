import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../stores/adminStore';
import { Plugin, PluginFeature } from '../types/plugin';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  DollarSign, 
  ToggleLeft, 
  ToggleRight,
  Save,
  List,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminPlugins: React.FC = () => {
  const { adminPlugins, fetchAdminPlugins, addAdminPlugin, updateAdminPlugin, deleteAdminPlugin } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPluginId, setEditingPluginId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    description: string;
    tokenCost: number;
    isActive: boolean;
    features: PluginFeature[];
    newFeatureName: string;
    newFeatureDescription: string;
  }>({
    id: '',
    name: '',
    description: '',
    tokenCost: 0,
    isActive: true,
    features: [],
    newFeatureName: '',
    newFeatureDescription: ''
  });

  useEffect(() => {
    const loadPlugins = async () => {
      setIsLoading(true);
      await fetchAdminPlugins();
      setIsLoading(false);
    };
    
    loadPlugins();
  }, [fetchAdminPlugins]);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      tokenCost: 0,
      isActive: true,
      features: [],
      newFeatureName: '',
      newFeatureDescription: ''
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (plugin: Plugin) => {
    setFormData({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      tokenCost: plugin.tokenCost,
      isActive: plugin.isActive,
      features: plugin.features || [],
      newFeatureName: '',
      newFeatureDescription: ''
    });
    setEditingPluginId(plugin.id);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPluginId(null);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'tokenCost') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddFeature = () => {
    if (!formData.newFeatureName.trim()) {
      toast.error('Feature name is required');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      features: [
        ...prev.features,
        {
          name: prev.newFeatureName,
          description: prev.newFeatureDescription
        }
      ],
      newFeatureName: '',
      newFeatureDescription: ''
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id.trim() || !formData.name.trim() || !formData.description.trim()) {
      toast.error('ID, name, and description are required');
      return;
    }
    
    try {
      if (editingPluginId) {
        // Update existing plugin
        const success = await updateAdminPlugin(editingPluginId, {
          name: formData.name,
          description: formData.description,
          tokenCost: formData.tokenCost,
          isActive: formData.isActive,
          features: formData.features
        });
        
        if (success) {
          handleCloseModal();
        }
      } else {
        // Add new plugin
        const success = await addAdminPlugin({
          id: formData.id,
          name: formData.name,
          description: formData.description,
          tokenCost: formData.tokenCost,
          isActive: formData.isActive,
          features: formData.features
        });
        
        if (success) {
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error('Error saving plugin:', error);
      toast.error('Failed to save plugin');
    }
  };

  const handleDeletePlugin = async (pluginId: string) => {
    if (window.confirm('Are you sure you want to delete this plugin? This action cannot be undone.')) {
      await deleteAdminPlugin(pluginId);
    }
  };

  const handleTogglePluginStatus = async (plugin: Plugin) => {
    await updateAdminPlugin(plugin.id, {
      isActive: !plugin.isActive
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Plugin Management</h3>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plugin</span>
          </button>
        </div>
        <p className="text-purple-200">
          Manage available plugins that users can purchase with tokens
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading plugins...</p>
        </div>
      ) : adminPlugins.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-purple-300 mx-auto mb-4" />
          <p className="text-purple-200">No plugins found</p>
          <p className="text-sm text-purple-300 mt-1">
            Add your first plugin to make it available to users
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Plugin</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Plugin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {adminPlugins.map((plugin) => (
                <tr key={plugin.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-white">{plugin.name}</p>
                      <p className="text-sm text-purple-300 font-mono">{plugin.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-purple-100">{plugin.description}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-green-300" />
                      <span className="text-lg font-semibold text-white">
                        {plugin.tokenCost}
                      </span>
                      <span className="text-xs text-purple-300">tokens</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plugin.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plugin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-purple-200">
                      {plugin.features?.length || 0} features
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                    {formatDate(plugin.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTogglePluginStatus(plugin)}
                        className={`p-1 rounded-lg transition-colors ${
                          plugin.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                        title={plugin.isActive ? 'Deactivate plugin' : 'Activate plugin'}
                      >
                        {plugin.isActive ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(plugin)}
                        className="p-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit plugin"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlugin(plugin.id)}
                        className="p-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete plugin"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Plugin Modal */}
      {(showAddModal || editingPluginId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingPluginId ? 'Edit Plugin' : 'Add New Plugin'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plugin ID
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    placeholder="unique-plugin-id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!!editingPluginId}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique identifier, use kebab-case (e.g., "risk-manager")
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Cost
                  </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="tokenCost"
                      value={formData.tokenCost}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cost in tokens to purchase this plugin
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plugin Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Risk Manager Pro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Advanced risk management tools for professional traders..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Plugin is active and available for purchase
                </label>
              </div>
              
              {/* Features Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <List className="w-4 h-4 mr-2" />
                    Plugin Features
                  </h4>
                  <span className="text-sm text-gray-500">
                    {formData.features.length} features
                  </span>
                </div>
                
                {/* Feature List */}
                {formData.features.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{feature.name}</p>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Feature Form */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Add New Feature</h5>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        name="newFeatureName"
                        value={formData.newFeatureName}
                        onChange={handleInputChange}
                        placeholder="Feature name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="newFeatureDescription"
                        value={formData.newFeatureDescription}
                        onChange={handleInputChange}
                        placeholder="Feature description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Feature</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPluginId ? 'Update Plugin' : 'Add Plugin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};