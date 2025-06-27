import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Plugin } from '../types/plugin';

interface AdminCredentials {
  username: string;
  password: string;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  tokens: {
    balance: number;
    earned: number;
    spent: number;
  } | null;
  last_sign_in_at?: string;
}

interface AdminState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  adminUsers: AdminUser[];
  adminPlugins: Plugin[];
  currentAdmin: {
    username: string;
    password: string;
    role: string;
  } | null;
  login: (credentials: AdminCredentials) => Promise<void>;
  logout: () => void;
  fetchAllUsersWithTokens: () => Promise<void>;
  fetchAdminPlugins: () => Promise<void>;
  addAdminPlugin: (plugin: Omit<Plugin, 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateAdminPlugin: (pluginId: string, updates: Partial<Plugin>) => Promise<boolean>;
  deleteAdminPlugin: (pluginId: string) => Promise<boolean>;
  addTokensToUser: (userId: string, amount: number, description: string) => Promise<boolean>;
  clearError: () => void;
}

// Admin credentials (in production, this would be in a secure backend)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  role: 'super_admin'
};

export const useAdminStore = create<AdminState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  adminUsers: [],
  adminPlugins: [],
  currentAdmin: null,

  login: async (credentials: AdminCredentials) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simple credential check (in production, this would be a secure API call)
      if (credentials.username === ADMIN_CREDENTIALS.username && 
          credentials.password === ADMIN_CREDENTIALS.password) {
        
        set({
          isAuthenticated: true,
          currentAdmin: {
            username: credentials.username,
            password: credentials.password, // Store for edge function calls
            role: ADMIN_CREDENTIALS.role
          },
          isLoading: false,
          error: null,
        });

        // Fetch users data after successful login
        await get().fetchAllUsersWithTokens();
        
        // Fetch plugins data
        await get().fetchAdminPlugins();
        
        toast.success('Admin login successful');
      } else {
        throw new Error('Invalid admin credentials');
      }
    } catch (error) {
      set({
        isAuthenticated: false,
        currentAdmin: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      currentAdmin: null,
      adminUsers: [],
      adminPlugins: [],
      error: null,
    });
  },

  fetchAllUsersWithTokens: async () => {
    try {
      console.log('🔄 Admin: Fetching all users with token data...');
      set({ isLoading: true });
      
      // Get all users from auth.users via RPC function
      const { data: authData, error: authError } = await supabase
        .rpc('get_all_users_email');
      
      if (authError) {
        console.error('❌ Error fetching user emails:', authError);
        toast.error('Failed to load user data');
        set({ isLoading: false });
        return;
      }
      
      if (!authData || authData.length === 0) {
        console.log('⚠️ No users found in auth.users');
        set({ adminUsers: [], isLoading: false });
        return;
      }
      
      console.log(`✅ Found ${authData.length} users in auth.users`);
      
      // Get token data for all users
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
        .select('*');
      
      if (tokenError) {
        console.error('❌ Error fetching token data:', tokenError);
        toast.error('Failed to load token data');
      }
      
      // Get last sign in data
      const { data: signInData, error: signInError } = await supabase
        .rpc('get_last_sign_in_times');
      
      if (signInError) {
        console.error('❌ Error fetching sign in times:', signInError);
      }
      
      // Create a map of user IDs to last sign in times
      const signInMap: Record<string, string> = {};
      if (signInData) {
        signInData.forEach((item: any) => {
          if (item.user_id && item.last_sign_in) {
            signInMap[item.user_id] = item.last_sign_in;
          }
        });
      }
      
      // Combine all data to create admin users
      const adminUsers: AdminUser[] = authData.map((user: any) => {
        const userTokens = tokenData?.find(token => token.user_id === user.id);
        const lastSignIn = signInMap[user.id];
        
        return {
          id: user.id,
          email: user.email || `User-${user.id.slice(0, 8)}`,
          created_at: user.created_at || new Date().toISOString(),
          last_sign_in_at: lastSignIn,
          tokens: userTokens ? {
            balance: userTokens.balance,
            earned: userTokens.earned,
            spent: userTokens.spent
          } : null
        };
      });
      
      set({ adminUsers, isLoading: false });
      console.log(`✅ Admin: Loaded ${adminUsers.length} users`);
      
    } catch (error) {
      console.error('❌ Admin: Error fetching all users with tokens:', error);
      toast.error('Failed to load admin data');
      set({ error: 'Failed to load user data', isLoading: false });
    }
  },

  fetchAdminPlugins: async () => {
    try {
      console.log('🔄 Admin: Fetching plugins...');
      
      const { data, error } = await supabase
        .from('plugins')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching plugins:', error);
        toast.error('Failed to load plugins data');
        return;
      }
      
      // Convert to Plugin interface
      const plugins: Plugin[] = data.map(plugin => ({
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        tokenCost: plugin.token_cost,
        features: plugin.features || [],
        isActive: plugin.is_active,
        expiresAt: plugin.expires_at,
        createdAt: plugin.created_at,
        updatedAt: plugin.updated_at
      }));
      
      set({ adminPlugins: plugins });
      console.log(`✅ Admin: Loaded ${plugins.length} plugins`);
      
    } catch (error) {
      console.error('❌ Admin: Error fetching plugins:', error);
      toast.error('Failed to load plugins data');
    }
  },

  addAdminPlugin: async (plugin: Omit<Plugin, 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      console.log('🔄 Admin: Adding new plugin:', plugin.name);
      
      const { error } = await supabase
        .from('plugins')
        .insert({
          id: plugin.id,
          name: plugin.name,
          description: plugin.description,
          token_cost: plugin.tokenCost,
          features: plugin.features || [],
          is_active: plugin.isActive,
          expires_at: plugin.expiresAt
        });
      
      if (error) {
        console.error('❌ Error adding plugin:', error);
        toast.error('Failed to add plugin');
        return false;
      }
      
      // Refresh plugins list
      await get().fetchAdminPlugins();
      
      toast.success(`Plugin "${plugin.name}" added successfully`);
      return true;
      
    } catch (error) {
      console.error('❌ Admin: Error adding plugin:', error);
      toast.error('Failed to add plugin');
      return false;
    }
  },

  updateAdminPlugin: async (pluginId: string, updates: Partial<Plugin>): Promise<boolean> => {
    try {
      console.log(`🔄 Admin: Updating plugin ${pluginId}:`, updates);
      
      const { error } = await supabase
        .from('plugins')
        .update({
          name: updates.name,
          description: updates.description,
          token_cost: updates.tokenCost,
          features: updates.features,
          is_active: updates.isActive,
          expires_at: updates.expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', pluginId);
      
      if (error) {
        console.error('❌ Error updating plugin:', error);
        toast.error('Failed to update plugin');
        return false;
      }
      
      // Refresh plugins list
      await get().fetchAdminPlugins();
      
      toast.success('Plugin updated successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Admin: Error updating plugin:', error);
      toast.error('Failed to update plugin');
      return false;
    }
  },

  deleteAdminPlugin: async (pluginId: string): Promise<boolean> => {
    try {
      console.log(`🔄 Admin: Deleting plugin ${pluginId}`);
      
      const { error } = await supabase
        .from('plugins')
        .delete()
        .eq('id', pluginId);
      
      if (error) {
        console.error('❌ Error deleting plugin:', error);
        toast.error('Failed to delete plugin');
        return false;
      }
      
      // Update local state
      set(state => ({
        adminPlugins: state.adminPlugins.filter(p => p.id !== pluginId)
      }));
      
      toast.success('Plugin deleted successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Admin: Error deleting plugin:', error);
      toast.error('Failed to delete plugin');
      return false;
    }
  },

  addTokensToUser: async (userId: string, amount: number, description: string): Promise<boolean> => {
    try {
      console.log(`🔄 Admin: Adding ${amount} tokens to user ${userId}`);
      
      const currentAdmin = get().currentAdmin;
      if (!currentAdmin) {
        toast.error('Admin authentication required');
        return false;
      }

      // Call the secure edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-add-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId,
          amount,
          description,
          adminCredentials: {
            username: currentAdmin.username,
            password: currentAdmin.password
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Error from edge function:', result.error);
        toast.error(result.error || 'Failed to add tokens');
        return false;
      }

      // Update local state with the new token values
      set(state => ({
        adminUsers: state.adminUsers.map(user => 
          user.id === userId 
            ? {
                ...user,
                tokens: {
                  balance: result.newBalance,
                  earned: result.newEarned,
                  spent: user.tokens?.spent || 0
                }
              }
            : user
        )
      }));

      toast.success(result.message);
      console.log(`✅ Admin: Successfully added ${amount} tokens to user ${userId}`);
      
      // Refresh the user list to show updated data
      await get().fetchAllUsersWithTokens();
      
      return true;

    } catch (error) {
      console.error('❌ Admin: Error adding tokens to user:', error);
      toast.error('Failed to add tokens to user');
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));