import { create } from 'zustand';
import { MT5Credentials, AccountInfo } from '../types/mt5';
import { UserTokens } from '../types/vps';
import { Plugin } from '../types/plugin';
import { supabase } from '../lib/supabase';
import mt5ApiService from '../lib/mt5ApiService';
import toast from 'react-hot-toast';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  credentials: MT5Credentials | null;
  accountInfo: AccountInfo | null;
  userTokens: UserTokens | null;
  userPlugins: Plugin[];
  lastAccountInfoUpdate: Date | null;
  error: string | null;
  autoRefreshInterval: NodeJS.Timeout | null;
  login: (credentials: MT5Credentials) => Promise<void>;
  logout: () => void;
  refreshAccountInfo: () => Promise<void>;
  fetchUserTokens: () => Promise<void>;
  fetchUserPlugins: () => Promise<void>;
  purchaseVPSPlan: (planId: string) => Promise<boolean>;
  purchasePlugin: (pluginId: string) => Promise<boolean>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  clearError: () => void;
  ensureMT5TokenStored: () => Promise<boolean>;
  reauthenticateMT5: () => Promise<boolean>;
  updateTokenCirculation: () => Promise<void>;
}

// Available plugins in the system
export const AVAILABLE_PLUGINS = [
  {
    id: 'multi-account',
    name: 'Multi-Account Manager',
    description: 'Manage multiple trading accounts simultaneously',
    tokenCost: 200,
    features: [
      'Connect unlimited MT5 accounts',
      'Copy trades between accounts',
      'Individual risk settings per account',
      'Consolidated reporting'
    ],
    icon: 'User'
  },
  {
    id: 'algo-bots',
    name: 'Algo Bot Pack',
    description: 'Advanced algorithmic trading bots',
    tokenCost: 300,
    features: [
      '10 premium trading strategies',
      'Machine learning optimization',
      'Custom indicators',
      'Backtesting tools'
    ],
    icon: 'TrendingUp'
  },
  {
    id: 'advanced-signals',
    name: 'Advanced Signals',
    description: 'Premium trading signals and alerts',
    tokenCost: 250,
    features: [
      'Professional signal providers',
      'Real-time market alerts',
      'Performance tracking',
      'Custom notification settings'
    ],
    icon: 'TrendingUp'
  },
  {
    id: 'risk-manager-pro',
    name: 'Risk Manager Pro',
    description: 'Advanced risk management tools',
    tokenCost: 150,
    features: [
      'Portfolio-level risk analysis',
      'Drawdown protection',
      'Correlation monitoring',
      'Risk-adjusted position sizing'
    ],
    icon: 'Shield'
  }
];

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  credentials: null,
  accountInfo: null,
  userTokens: null,
  userPlugins: [],
  lastAccountInfoUpdate: null,
  error: null,
  autoRefreshInterval: null,

  login: async (credentials: MT5Credentials) => {
    set({ isLoading: true, error: null });
    
    try {
      // First, check if user is already authenticated with Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('You must be logged in to connect a broker');
      }

      console.log('🔐 DEBUG: Starting MT5 login process for user:', session.user.id);

      // Then connect to MT5
      const connectionCredentials = {
        accountNumber: credentials.username,
        password: credentials.password,
        serverName: credentials.server
      };
      
      const result = await mt5ApiService.connect(connectionCredentials);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      console.log('✅ DEBUG: MT5 connection successful, token receive:', result.token ? 'YES' : 'NO');
      
      // Get account info to verify connection
      const accountInfo = await mt5ApiService.getAccountInfo();
      
      if (!accountInfo) {
        throw new Error('Failed to retrieve account information');
      }

      console.log('📊 DEBUG: Account info retrieved successfully:', {
        accountNumber: accountInfo.accountNumber,
        serverName: accountInfo.serverName,
        balance: accountInfo.balance
      });

      // Add account type to account info
      const enhancedAccountInfo = {
        ...accountInfo,
        accountType: credentials.accountType
      };

      // ENHANCED: Store MT5 token with account type in user_accounts table
      let mt5AccountId = null;
      if (result.token && session.user.id) {
        try {
          console.log('🔑 DEBUG: Preparing to store MT5 token with account data:', {
            userId: session.user.id,
            username: credentials.username,
            server: credentials.server,
            accountType: credentials.accountType,
            tokenReceived: !!result.token,
            tokenLength: result.token ? result.token.length : 0,
            accountName: credentials.nickname || enhancedAccountInfo.accountName || ''
          });
          
          // First, deactivate all existing accounts for this user
          const { error: deactivateError } = await supabase
            .from('user_accounts')
            .update({ is_active: false })
            .eq('user_id', session.user.id);
            
          if (deactivateError) {
            console.error('❌ DEBUG: Error deactivating existing accounts:', deactivateError);
          } else {
            console.log('✅ DEBUG: Successfully deactivated existing accounts');
          }
          
          // Prepare data for upsert
          const accountData = {
            user_id: session.user.id,
            mt5_username: credentials.username,
            mt5_server: credentials.server,
            account_name: credentials.nickname || enhancedAccountInfo.accountName || '',
            account_type: credentials.accountType, // Store account type
            mt5_token: result.token,
            is_active: true,
            updated_at: new Date().toISOString()
          };
          
          console.log('📤 DEBUG: Sending upsert data to Supabase:', accountData);
          
          const { data: upsertData, error: upsertError } = await supabase
            .from('user_accounts')
            .upsert(accountData, {
              onConflict: 'user_id,mt5_username,mt5_server'
            })
            .select();

          console.log('📥 DEBUG: Upsert response data:', upsertData);

          if (upsertError) {
            console.error('❌ DEBUG: Error storing MT5 token - FULL ERROR:', upsertError);
            console.error('❌ DEBUG: Error details:', {
              code: upsertError.code,
              message: upsertError.message,
              details: upsertError.details,
              hint: upsertError.hint
            });
            toast.error('Warning: MT5 token could not be stored. Automatic trading may not work.');
          } else {
            console.log('✅ DEBUG: MT5 token stored successfully with account type for webhook automation');
            
            // Store the MT5 account ID for robot filtering
            if (upsertData && upsertData.length > 0) {
              mt5AccountId = upsertData[0].id;
              console.log('✅ DEBUG: Retrieved MT5 account ID:', mt5AccountId);
            } else {
              // If upsert didn't return data, fetch the account ID
              const { data: accountData, error: fetchError } = await supabase
                .from('user_accounts')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .single();
                
              if (fetchError) {
                console.error('❌ DEBUG: Error fetching MT5 account ID:', fetchError);
              } else if (accountData) {
                mt5AccountId = accountData.id;
                console.log('✅ DEBUG: Fetched MT5 account ID:', mt5AccountId);
              }
            }
            
            const accountTypeLabel = credentials.accountType.charAt(0).toUpperCase() + credentials.accountType.slice(1);
            toast.success(`MT5 ${accountTypeLabel} account connected and configured for automatic trading!`);
          }
        } catch (error) {
          console.error('❌ DEBUG: Unexpected error storing MT5 token:', error);
          toast.error('Warning: MT5 token could not be stored. Automatic trading may not work.');
        }
      } else {
        console.warn('⚠️ DEBUG: Cannot store MT5 token - missing token or user ID:', {
          hasToken: !!result.token,
          hasUserId: !!session.user.id
        });
      }

      // Initialize user tokens if they don't exist
      await get().fetchUserTokens();
      
      // Fetch user plugins
      await get().fetchUserPlugins();
      
      set({
        isAuthenticated: true,
        credentials: {
          ...credentials,
          mt5AccountId // Add the MT5 account ID to credentials
        },
        accountInfo: enhancedAccountInfo,
        lastAccountInfoUpdate: new Date(),
        isLoading: false,
        error: null,
      });

      // Start auto-refresh after successful login
      get().startAutoRefresh();
    } catch (error) {
      console.error('❌ DEBUG: Login process failed:', error);
      
      // Provide more specific error messages for MT5 authentication failures
      let errorMessage = 'Login failed';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication failed') && error.message.includes('Please check your credentials')) {
          errorMessage = 'MT5 authentication failed. Please double-check your account number, password, and server name.';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  logout: async () => {
    // Stop auto-refresh before logout
    get().stopAutoRefresh();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Disconnect from MT5
    mt5ApiService.disconnect();
    
    set({
      isAuthenticated: false,
      credentials: null,
      accountInfo: null,
      userTokens: null,
      userPlugins: [],
      lastAccountInfoUpdate: null,
      error: null,
      autoRefreshInterval: null,
    });
  },

  // New method to attempt re-authentication with MT5
  reauthenticateMT5: async (): Promise<boolean> => {
    try {
      console.log('🔄 DEBUG: Attempting to reauthenticate MT5 connection...');
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.error('❌ DEBUG: No authenticated user found for reauthentication');
        return false;
      }
      
      // Get active MT5 account details from database
      const { data: userAccount, error: accountError } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (accountError) {
        console.error('❌ DEBUG: Error fetching user account for reauthentication:', accountError);
        return false;
      }
      
      if (!userAccount) {
        console.error('❌ DEBUG: No active MT5 account found for reauthentication');
        return false;
      }
      
      console.log('✅ DEBUG: Found active MT5 account for reauthentication:', {
        username: userAccount.mt5_username,
        server: userAccount.mt5_server,
        accountType: userAccount.account_type,
        accountId: userAccount.id
      });
      
      // We need the password to reconnect, but we don't store it
      // Instead, we'll use the current credentials if available
      const currentCredentials = get().credentials;
      
      if (!currentCredentials || !currentCredentials.password) {
        console.error('❌ DEBUG: No credentials available for reauthentication');
        return false;
      }
      
      // Create connection credentials
      const connectionCredentials = {
        accountNumber: userAccount.mt5_username,
        password: currentCredentials.password, // Use the password from current session
        serverName: userAccount.mt5_server
      };
      
      console.log('🔄 DEBUG: Attempting to reconnect to MT5 with stored credentials');
      
      // Attempt to reconnect
      const result = await mt5ApiService.connect(connectionCredentials);
      
      if (!result.success) {
        console.error('❌ DEBUG: MT5 reauthentication failed:', result.message);
        return false;
      }
      
      console.log('✅ DEBUG: MT5 reauthentication successful, token received:', result.token ? 'YES' : 'NO');
      
      // Update the token in the database
      if (result.token) {
        const { error: updateError } = await supabase
          .from('user_accounts')
          .update({
            mt5_token: result.token,
            updated_at: new Date().toISOString()
          })
          .eq('id', userAccount.id);
        
        if (updateError) {
          console.error('❌ DEBUG: Error updating MT5 token after reauthentication:', updateError);
        } else {
          console.log('✅ DEBUG: MT5 token updated in database after reauthentication');
        }
      }
      
      // Get account info to verify connection
      const accountInfo = await mt5ApiService.getAccountInfo();
      
      if (!accountInfo) {
        console.error('❌ DEBUG: Failed to retrieve account info after reauthentication');
        return false;
      }
      
      // Add account type to account info
      const enhancedAccountInfo = {
        ...accountInfo,
        accountType: userAccount.account_type
      };
      
      // Update state with new account info and MT5 account ID
      set({
        credentials: {
          ...currentCredentials,
          mt5AccountId: userAccount.id // Update the MT5 account ID
        },
        accountInfo: enhancedAccountInfo,
        lastAccountInfoUpdate: new Date()
      });
      
      console.log('✅ DEBUG: MT5 reauthentication completed successfully');
      return true;
    } catch (error) {
      console.error('❌ DEBUG: MT5 reauthentication failed with error:', error);
      return false;
    }
  },

  refreshAccountInfo: async () => {
    if (!get().isAuthenticated) return;
    
    try {
      const accountInfo = await mt5ApiService.getAccountInfo();
      if (accountInfo) {
        // Preserve account type and MT5 account ID from credentials
        const credentials = get().credentials;
        const enhancedAccountInfo = {
          ...accountInfo,
          accountType: credentials?.accountType
        };
        
        set({ 
          accountInfo: enhancedAccountInfo,
          lastAccountInfoUpdate: new Date()
        });
      }
    } catch (error) {
      // If there's an authentication error, try to reauthenticate
      if (error instanceof Error) {
        console.error('Failed to refresh account info:', error.message);
        
        // Check if it's an authentication issue
        if (error.message.includes('Authentication failed') || 
            error.message.includes('Session expired') || 
            error.message.includes('Invalid token')) {
          
          console.log('🔄 DEBUG: Authentication error detected, attempting to reauthenticate...');
          
          // Try to reauthenticate
          const reauthSuccess = await get().reauthenticateMT5();
          
          if (reauthSuccess) {
            console.log('✅ DEBUG: Reauthentication successful, continuing session');
            toast.success('MT5 session refreshed successfully');
            return;
          } else {
            console.error('❌ DEBUG: Reauthentication failed, logging out user');
            toast.error('MT5 session expired. Please login again.');
            get().logout();
          }
        } else {
          // Don't show toast for every failed refresh to avoid spam
          console.warn('Account info refresh failed:', error.message);
        }
      } else {
        console.error('Failed to refresh account info:', error);
      }
    }
  },

  fetchUserTokens: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('❌ No authenticated user found for token fetch');
        return;
      }

      console.log('🔄 DEBUG: Fetching user tokens for user ID:', session.user.id);

      // First, check if the user exists in auth.users
      // We can do this by checking if we can get the user's profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ DEBUG: Error checking user profile:', profileError);
      }

      // If the user doesn't exist in profiles, we need to create it
      if (!userProfile) {
        console.log('⚠️ DEBUG: User profile not found, creating profile record first');
        
        // Create a profile record for the user
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            updated_at: new Date().toISOString()
          });
          
        if (createProfileError) {
          console.error('❌ DEBUG: Error creating user profile:', createProfileError);
          return;
        }
        
        console.log('✅ DEBUG: Created user profile successfully');
      } else {
        console.log('✅ DEBUG: User profile exists:', userProfile);
      }

      // Get user tokens record - use maybeSingle() to avoid error when no record exists
      let { data: userTokens, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ DEBUG: Error fetching user tokens:', error);
        return;
      }

      console.log('📊 DEBUG: User tokens fetch result:', userTokens ? 'Found' : 'Not found');

      if (!userTokens) {
        // No record exists, create one with proper error handling for race conditions
        try {
          console.log('🔄 DEBUG: Creating new user_tokens record for user:', session.user.id);
          
          const { data: newTokens, error: createError } = await supabase
            .from('user_tokens')
            .insert({
              user_id: session.user.id,
              balance: 100, // Give new users 100 tokens to start
              earned: 100,
              spent: 0
            })
            .select()
            .single();

          if (createError) {
            // Check if it's a duplicate key error (race condition)
            if (createError.code === '23505') {
              console.log('⚠️ DEBUG: User tokens record already exists (race condition), fetching existing record...');
              
              // Fetch the existing record instead
              const { data: existingTokens, error: fetchError } = await supabase
                .from('user_tokens')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (fetchError) {
                console.error('❌ DEBUG: Error fetching existing user tokens after race condition:', fetchError);
                return;
              }

              userTokens = existingTokens;
              console.log('✅ DEBUG: Retrieved existing tokens after race condition');
            } else if (createError.code === '23503') {
              // Foreign key constraint violation - user doesn't exist in auth.users
              console.error('❌ DEBUG: Foreign key constraint error - user may not exist in auth.users:', createError);
              console.log('🔄 DEBUG: Attempting to verify user existence and fix the issue...');
              
              // We'll skip token creation for now and return
              console.log('⚠️ DEBUG: Skipping token creation due to foreign key constraint');
              return;
            } else {
              console.error('❌ DEBUG: Error creating user tokens:', createError);
              return;
            }
          } else {
            userTokens = newTokens;
            console.log('✅ DEBUG: Created new user tokens record successfully');
            
            // Create welcome transaction only for newly created records
            const { error: transactionError } = await supabase
              .from('token_transactions')
              .insert({
                user_id: session.user.id,
                type: 'earned',
                amount: 100,
                description: 'Welcome bonus - 100 free tokens!',
                related_service: 'welcome'
              });
              
            if (transactionError) {
              console.error('❌ DEBUG: Error creating welcome transaction:', transactionError);
            } else {
              console.log('✅ DEBUG: Created welcome transaction successfully');
            }

            toast.success('Welcome! You received 100 free tokens to get started!');
          }
        } catch (insertError) {
          console.error('❌ DEBUG: Unexpected error during user tokens creation:', insertError);
          return;
        }
      }

      // If we still don't have user tokens (due to errors), return
      if (!userTokens) {
        console.log('⚠️ DEBUG: No user tokens available after all attempts');
        return;
      }

      // Get recent transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('❌ DEBUG: Error fetching token transactions:', transactionsError);
      } else {
        console.log(`✅ DEBUG: Fetched ${transactions?.length || 0} token transactions`);
      }

      const userTokensData: UserTokens = {
        id: userTokens.id,
        userId: userTokens.user_id,
        balance: userTokens.balance,
        earned: userTokens.earned,
        spent: userTokens.spent,
        transactions: transactions?.map(t => ({
          id: t.id,
          userId: t.user_id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          relatedService: t.related_service,
          timestamp: t.created_at
        })) || []
      };

      set({ userTokens: userTokensData });
      console.log(`✅ DEBUG: User tokens loaded: ${userTokensData.balance} balance, ${userTokensData.earned} earned, ${userTokensData.spent} spent`);
    } catch (error) {
      console.error('❌ DEBUG: Error fetching user tokens:', error);
    }
  },

  // New method to update token circulation stats in real-time
  updateTokenCirculation: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('❌ No authenticated user found for token circulation update');
        return;
      }

      // Get current token state
      const { userTokens } = get();
      if (!userTokens) {
        console.log('❌ No user tokens available for circulation update');
        return;
      }

      // Calculate total tokens in circulation
      const { data: totalStats, error: statsError } = await supabase
        .rpc('get_token_circulation_stats');

      if (statsError) {
        console.error('❌ Error fetching token circulation stats:', statsError);
        return;
      }

      if (totalStats && totalStats.length > 0) {
        const stats = totalStats[0];
        console.log('✅ Token circulation stats updated:', {
          totalBalance: stats.total_balance,
          totalEarned: stats.total_earned,
          totalSpent: stats.total_spent
        });
      }

      // Refresh user's own token data
      await get().fetchUserTokens();

    } catch (error) {
      console.error('❌ Error updating token circulation:', error);
    }
  },

  fetchUserPlugins: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('❌ No authenticated user found for plugins fetch');
        return;
      }

      // Get user plugins from the database
      const { data: userPluginsData, error } = await supabase
        .from('user_plugins')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('❌ Error fetching user plugins:', error);
        return;
      }

      // Convert to Plugin interface
      const plugins: Plugin[] = userPluginsData?.map(plugin => ({
        id: plugin.plugin_id,
        name: plugin.name,
        description: plugin.description,
        tokenCost: plugin.token_cost,
        isActive: plugin.is_active,
        expiresAt: plugin.expires_at
      })) || [];

      set({ userPlugins: plugins });
      console.log(`✅ User plugins loaded: ${plugins.length} plugins`);
    } catch (error) {
      console.error('❌ Error fetching user plugins:', error);
    }
  },

  purchaseVPSPlan: async (planId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast.error('You must be logged in to purchase a VPS plan');
        return false;
      }

      const userTokens = get().userTokens;
      if (!userTokens) {
        toast.error('Unable to load token balance');
        return false;
      }

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('vps_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        toast.error('VPS plan not found');
        return false;
      }

      // Check if user has sufficient tokens
      if (userTokens.balance < plan.token_cost) {
        toast.error(`Insufficient tokens. You need ${plan.token_cost - userTokens.balance} more tokens.`);
        return false;
      }

      // Handle free plan
      if (plan.token_cost === 0) {
        toast('You are already on the free plan');
        return true;
      }

      // Calculate subscription end date
      const startDate = new Date();
      const endDate = new Date();
      
      if (plan.duration === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.duration === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (plan.duration === 'lifetime') {
        endDate.setFullYear(endDate.getFullYear() + 100); // Effectively lifetime
      }

      // Start transaction
      const { error: subscriptionError } = await supabase
        .from('user_vps_subscriptions')
        .insert({
          user_id: session.user.id,
          plan_id: planId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          tokens_spent: plan.token_cost,
          is_active: true
        });

      if (subscriptionError) {
        console.error('❌ Error creating VPS subscription:', subscriptionError);
        toast.error('Failed to create VPS subscription');
        return false;
      }

      // Deduct tokens
      const newBalance = userTokens.balance - plan.token_cost;
      const newSpent = userTokens.spent + plan.token_cost;

      const { error: tokenError } = await supabase
        .from('user_tokens')
        .update({
          balance: newBalance,
          spent: newSpent,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (tokenError) {
        console.error('❌ Error updating user tokens:', tokenError);
        toast.error('Failed to process token payment');
        return false;
      }

      // Create transaction record
      await supabase
        .from('token_transactions')
        .insert({
          user_id: session.user.id,
          type: 'spent',
          amount: plan.token_cost,
          description: `VPS Plan: ${plan.name} (${plan.duration})`,
          related_service: 'vps'
        });

      // Update local state
      set({
        userTokens: {
          ...userTokens,
          balance: newBalance,
          spent: newSpent
        }
      });

      // Update token circulation stats
      await get().updateTokenCirculation();

      toast.success(`Successfully upgraded to ${plan.name}! Your VPS is being set up.`);
      return true;

    } catch (error) {
      console.error('❌ Error purchasing VPS plan:', error);
      toast.error('Failed to purchase VPS plan');
      return false;
    }
  },

  purchasePlugin: async (pluginId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast.error('You must be logged in to purchase a plugin');
        return false;
      }

      const userTokens = get().userTokens;
      if (!userTokens) {
        toast.error('Unable to load token balance');
        return false;
      }

      // Get plugin details from database
      const { data: pluginData, error: pluginError } = await supabase
        .from('plugins')
        .select('*')
        .eq('id', pluginId)
        .single();

      if (pluginError) {
        console.error('❌ Error fetching plugin details:', pluginError);
        
        // Fallback to available plugins constant if database fetch fails
        const pluginDetails = AVAILABLE_PLUGINS.find(p => p.id === pluginId);
        if (!pluginDetails) {
          toast.error('Plugin not found');
          return false;
        }
        
        // Continue with the constant data
        return await purchasePluginWithDetails(session.user.id, userTokens, {
          id: pluginDetails.id,
          name: pluginDetails.name,
          description: pluginDetails.description,
          tokenCost: pluginDetails.tokenCost,
          isActive: true
        });
      }
      
      // Convert database plugin to Plugin interface
      const plugin: Plugin = {
        id: pluginData.id,
        name: pluginData.name,
        description: pluginData.description,
        tokenCost: pluginData.token_cost,
        features: pluginData.features,
        isActive: pluginData.is_active
      };
      
      // Process the purchase with the plugin details
      return await purchasePluginWithDetails(session.user.id, userTokens, plugin);
      
    } catch (error) {
      console.error('❌ Error purchasing plugin:', error);
      toast.error('Failed to purchase plugin');
      return false;
    }
  },

  // ENHANCED: Ensure MT5 token is properly stored with account type
  ensureMT5TokenStored: async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('❌ No authenticated user found');
        return false;
      }

      console.log('🔍 DEBUG: Checking if MT5 token is stored for user:', session.user.id);

      // Check if MT5 token is already stored - use limit(1) to avoid multiple rows error
      const { data: userAccounts, error: fetchError } = await supabase
        .from('user_accounts')
        .select('id, mt5_token, mt5_username, mt5_server, account_type')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .limit(1);

      if (fetchError) {
        console.error('❌ DEBUG: Error checking MT5 token:', fetchError);
        return false;
      }

      const userAccount = userAccounts?.[0];

      console.log('📊 DEBUG: User account data retrieved:', {
        hasAccount: !!userAccount,
        hasToken: userAccount?.mt5_token ? 'YES' : 'NO',
        username: userAccount?.mt5_username,
        server: userAccount?.mt5_server,
        accountType: userAccount?.account_type,
        accountId: userAccount?.id
      });

      if (userAccount?.mt5_token) {
        console.log('✅ DEBUG: MT5 token already stored and available');
        
        // Update credentials with MT5 account ID if not already set
        const currentCredentials = get().credentials;
        if (currentCredentials && !currentCredentials.mt5AccountId && userAccount.id) {
          set({
            credentials: {
              ...currentCredentials,
              mt5AccountId: userAccount.id
            }
          });
          console.log('✅ DEBUG: Updated credentials with MT5 account ID:', userAccount.id);
        }
        
        return true;
      }

      // If no token stored, try to get current MT5 token and store it
      const currentToken = mt5ApiService.getStoredToken();
      const credentials = get().credentials;
      const accountInfo = get().accountInfo;

      console.log('🔑 DEBUG: Current state for token storage:', {
        hasStoredToken: !!currentToken,
        hasCredentials: !!credentials,
        hasAccountInfo: !!accountInfo,
        tokenLength: currentToken ? currentToken.length : 0
      });

      if (currentToken && credentials && accountInfo) {
        console.log('🔄 DEBUG: Storing missing MT5 token with account type...', {
          userId: session.user.id,
          username: credentials.username,
          server: credentials.server,
          accountType: credentials.accountType,
          accountName: accountInfo.accountName || ''
        });
        
        // First, deactivate all existing accounts for this user
        const { error: deactivateError } = await supabase
          .from('user_accounts')
          .update({ is_active: false })
          .eq('user_id', session.user.id);
          
        if (deactivateError) {
          console.error('❌ DEBUG: Error deactivating existing accounts:', deactivateError);
        } else {
          console.log('✅ DEBUG: Successfully deactivated existing accounts');
        }
        
        // Prepare data for upsert
        const accountData = {
          user_id: session.user.id,
          mt5_username: credentials.username,
          mt5_server: credentials.server,
          account_name: accountInfo.accountName || '',
          account_type: credentials.accountType, // Include account type
          mt5_token: currentToken,
          is_active: true,
          updated_at: new Date().toISOString()
        };
        
        console.log('📤 DEBUG: Sending upsert data to Supabase:', accountData);

        const { data: upsertData, error: upsertError } = await supabase
          .from('user_accounts')
          .upsert(accountData, {
            onConflict: 'user_id,mt5_username,mt5_server'
          })
          .select();

        console.log('📥 DEBUG: Upsert response data:', upsertData);

        if (upsertError) {
          console.error('❌ DEBUG: Error storing MT5 token - FULL ERROR:', upsertError);
          console.error('❌ DEBUG: Error details:', {
            code: upsertError.code,
            message: upsertError.message,
            details: upsertError.details,
            hint: upsertError.hint
          });
          return false;
        }

        console.log('✅ DEBUG: MT5 token stored successfully with account type');
        
        // Update credentials with MT5 account ID
        if (upsertData && upsertData.length > 0) {
          set({
            credentials: {
              ...credentials,
              mt5AccountId: upsertData[0].id
            }
          });
          console.log('✅ DEBUG: Updated credentials with MT5 account ID:', upsertData[0].id);
        }
        
        toast.success('MT5 token updated for automatic trading');
        return true;
      }

      console.log('⚠️ DEBUG: No MT5 token available to store');
      return false;
    } catch (error) {
      console.error('❌ DEBUG: Error ensuring MT5 token storage:', error);
      return false;
    }
  },

  startAutoRefresh: () => {
    // Clear any existing interval
    get().stopAutoRefresh();
    
    // Set up auto-refresh every 100ms for ultra-fast account updates
    const interval = setInterval(() => {
      get().refreshAccountInfo();
    }, 100);
    
    set({ autoRefreshInterval: interval });
  },

  stopAutoRefresh: () => {
    const { autoRefreshInterval } = get();
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      set({ autoRefreshInterval: null });
    }
  },

  clearError: () => set({ error: null }),
}));

// Helper function to purchase a plugin with given details
async function purchasePluginWithDetails(
  userId: string, 
  userTokens: UserTokens, 
  plugin: Plugin
): Promise<boolean> {
  try {
    // Check if user already has this plugin
    const { data: existingPlugins } = await supabase
      .from('user_plugins')
      .select('id')
      .eq('user_id', userId)
      .eq('plugin_id', plugin.id);
      
    if (existingPlugins && existingPlugins.length > 0) {
      toast('You already own this plugin');
      return true;
    }

    // Check if user has sufficient tokens
    if (userTokens.balance < plugin.tokenCost) {
      toast.error(`Insufficient tokens. You need ${plugin.tokenCost - userTokens.balance} more tokens.`);
      return false;
    }

    // Calculate expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Insert into user_plugins table
    const { error: pluginError } = await supabase
      .from('user_plugins')
      .insert({
        user_id: userId,
        plugin_id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        token_cost: plugin.tokenCost,
        is_active: true,
        expires_at: expiresAt.toISOString()
      });

    if (pluginError) {
      console.error('❌ Error creating plugin record:', pluginError);
      toast.error('Failed to purchase plugin');
      return false;
    }

    // Deduct tokens
    const newBalance = userTokens.balance - plugin.tokenCost;
    const newSpent = userTokens.spent + plugin.tokenCost;

    const { error: tokenError } = await supabase
      .from('user_tokens')
      .update({
        balance: newBalance,
        spent: newSpent,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (tokenError) {
      console.error('❌ Error updating user tokens:', tokenError);
      toast.error('Failed to process token payment');
      return false;
    }

    // Create transaction record
    await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        type: 'spent',
        amount: plugin.tokenCost,
        description: `Plugin: ${plugin.name}`,
        related_service: 'plugins'
      });

    // Update local state
    useAuthStore.setState(state => ({
      userTokens: {
        ...state.userTokens!,
        balance: newBalance,
        spent: newSpent
      },
      userPlugins: [
        ...state.userPlugins,
        {
          id: plugin.id,
          name: plugin.name,
          description: plugin.description,
          tokenCost: plugin.tokenCost,
          isActive: true,
          expiresAt: expiresAt.toISOString()
        }
      ]
    }));

    // Update token circulation stats
    await useAuthStore.getState().updateTokenCirculation();

    toast.success(`Successfully purchased ${plugin.name}!`);
    return true;
  } catch (error) {
    console.error('❌ Error in purchasePluginWithDetails:', error);
    toast.error('Failed to purchase plugin');
    return false;
  }
}

// Initialize auth state from Supabase session
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    useAuthStore.setState({ isAuthenticated: true });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ 
      isAuthenticated: false,
      credentials: null,
      accountInfo: null,
      userTokens: null
    });
  }
});

// Check initial session
(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      useAuthStore.setState({ isAuthenticated: true });
    }
  } catch (error) {
    console.error('Error checking initial session:', error);
    // Clear any corrupted session data
    await supabase.auth.signOut();
    useAuthStore.setState({ isAuthenticated: false });
  }
})();