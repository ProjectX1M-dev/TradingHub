import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, Calendar, Percent, Save, X, AlertTriangle, Check, Loader } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export const AdminPromoCodes: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 10,
    maxUses: 100,
    expiresAt: '',
    isActive: true,
    agreedToTerms: false
  });

  useEffect(() => {
    fetchPromoCodes();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPromoCodes();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching promo codes:', error);
        toast.error('Failed to load promo codes');
        return;
      }
      
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountPercent: 10,
      maxUses: 100,
      expiresAt: '',
      isActive: true,
      agreedToTerms: false
    });
    setFormErrors([]);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      discountPercent: promo.discount_percent,
      maxUses: promo.max_uses,
      expiresAt: promo.expires_at ? new Date(promo.expires_at).toISOString().split('T')[0] : '',
      isActive: promo.is_active,
      agreedToTerms: true
    });
    setEditingPromoId(promo.id);
    setShowAddModal(true);
  };

  const handleOpenDeleteModal = (promo: PromoCode) => {
    setPromoToDelete(promo);
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPromoId(null);
    resetForm();
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setPromoToDelete(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'discountPercent' || name === 'maxUses') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.code.trim()) {
      errors.push('Promo code is required');
    }
    
    if (formData.discountPercent <= 0 || formData.discountPercent > 100) {
      errors.push('Discount percent must be between 1 and 100');
    }
    
    if (formData.maxUses <= 0) {
      errors.push('Maximum uses must be greater than 0');
    }
    
    if (!formData.agreedToTerms && !editingPromoId) {
      errors.push('You must agree to the terms and conditions');
    }
    
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Use the admin-promo-code edge function
      const endpoint = `${supabaseUrl}/functions/v1/admin-promo-code`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          action: editingPromoId ? 'update' : 'create',
          promoId: editingPromoId,
          promoData: {
            code: formData.code.toUpperCase(),
            discountPercent: formData.discountPercent,
            maxUses: formData.maxUses,
            expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
            isActive: formData.isActive
          },
          adminCredentials: {
            username: 'admin',
            password: 'admin123'
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save promo code');
      }
      
      toast.success(result.message || (editingPromoId ? 'Promo code updated successfully' : 'Promo code created successfully'));
      
      // Refresh promo codes list
      fetchPromoCodes();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save promo code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePromoCode = async () => {
    if (!promoToDelete) return;
    
    try {
      // Use the admin-promo-code edge function for deletion
      const endpoint = `${supabaseUrl}/functions/v1/admin-promo-code`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          action: 'delete',
          promoId: promoToDelete.id,
          adminCredentials: {
            username: 'admin',
            password: 'admin123'
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete promo code');
      }
      
      toast.success(result.message || 'Promo code deleted successfully');
      fetchPromoCodes();
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete promo code');
    }
  };

  const handleTogglePromoStatus = async (promo: PromoCode) => {
    try {
      // Use the admin-promo-code edge function for toggling status
      const endpoint = `${supabaseUrl}/functions/v1/admin-promo-code`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          action: 'toggle',
          promoId: promo.id,
          isActive: !promo.is_active,
          adminCredentials: {
            username: 'admin',
            password: 'admin123'
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update promo code status');
      }
      
      toast.success(`Promo code ${promo.is_active ? 'deactivated' : 'activated'}`);
      fetchPromoCodes();
    } catch (error) {
      console.error('Error toggling promo code status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update promo code status');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const generateRandomCode = () => {
    const prefixes = ['SUMMER', 'WINTER', 'SPRING', 'FALL', 'PROMO', 'SAVE', 'DEAL', 'SPECIAL', 'VIP', 'WELCOME'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(Math.random() * 90) + 10; // 10-99
    const randomCode = `${randomPrefix}${randomNumber}`;
    setFormData(prev => ({ ...prev, code: randomCode }));
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Promo Code Management</h3>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>
        <p className="text-purple-200">
          Create and manage promo codes for token package discounts
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading promo codes...</p>
        </div>
      ) : promoCodes.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-purple-300 mx-auto mb-4" />
          <p className="text-purple-200">No promo codes found</p>
          <p className="text-sm text-purple-300 mt-1">
            Create your first promo code to offer discounts to users
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Promo Code</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Status
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
              {promoCodes.map((promo) => (
                <tr key={promo.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-purple-300" />
                      <span className="font-mono font-medium text-white">{promo.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Percent className="w-4 h-4 text-green-300" />
                      <span className="text-lg font-semibold text-white">
                        {promo.discount_percent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white">
                      {promo.used_count} / {promo.max_uses}
                    </span>
                    <div className="w-24 bg-gray-700 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full" 
                        style={{ inlineSize: promo.max_uses > 0 ? `${Math.min((promo.used_count / promo.max_uses) * 100, 100)}%` : '0%' }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promo.expires_at ? (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-purple-300" />
                        <span className={`text-sm ${isExpired(promo.expires_at) ? 'text-red-300' : 'text-white'}`}>
                          {formatDate(promo.expires_at)}
                          {isExpired(promo.expires_at) && ' (Expired)'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      promo.is_active && !isExpired(promo.expires_at)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {promo.is_active && !isExpired(promo.expires_at) ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                    {formatDate(promo.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTogglePromoStatus(promo)}
                        className={`p-1 rounded-lg transition-colors ${
                          promo.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={promo.is_active ? 'Deactivate promo code' : 'Activate promo code'}
                      >
                        {promo.is_active ? (
                          <X className="w-5 h-5" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(promo)}
                        className="p-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit promo code"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(promo)}
                        className="p-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete promo code"
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

      {/* Add/Edit Promo Code Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingPromoId ? 'Edit Promo Code' : 'Create Promo Code'}
            </h3>
            
            {formErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">Please fix the following errors:</p>
                    <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                      {formErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code *
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Tag className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="SUMMER20"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase ${
                        formErrors.includes('Promo code is required') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      disabled={!!editingPromoId}
                      required
                    />
                  </div>
                  {!editingPromoId && (
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Generate random code"
                    >
                      Generate
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {editingPromoId ? 'Promo code cannot be changed' : 'Use uppercase letters and numbers, no spaces'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage *
                </label>
                <div className="relative">
                  <Percent className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    name="discountPercent"
                    value={formData.discountPercent}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.includes('Discount percent must be between 1 and 100') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Percentage discount applied to the package price
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Uses *
                </label>
                <input
                  type="number"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    formErrors.includes('Maximum uses must be greater than 0') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many times this code can be used in total
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank for no expiration
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Promo code is active and available for use
                </label>
              </div>
              
              {!editingPromoId && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleInputChange}
                    className={`w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${
                      formErrors.includes('You must agree to the terms and conditions') ? 'border-red-300' : ''
                    }`}
                  />
                  <label htmlFor="agreedToTerms" className="ml-2 text-sm text-gray-700">
                    I understand that this promo code will be available to all users
                  </label>
                </div>
              )}
              
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
                  disabled={isSaving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingPromoId ? 'Update Promo Code' : 'Create Promo Code'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && promoToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-red-100 p-3 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Promo Code</h3>
                <p className="text-gray-600 mt-1">
                  Are you sure you want to delete the promo code <span className="font-mono font-medium">{promoToDelete.code}</span>?
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Warning</p>
                  <p className="text-red-700 text-sm mt-1">
                    This action cannot be undone. Users will no longer be able to use this promo code.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePromoCode}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Promo Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};