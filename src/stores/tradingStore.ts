import { create } from 'zustand';
import { Position, TradingSignal, Robot } from '../types/mt5';
import mt5ApiService from '../lib/mt5ApiService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import toast from 'react-hot-toast';

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

interface TradingState {
  positions: Position[];
  signals: TradingSignal[];
  robots: Robot[];
  availableSymbols: string[];
  adminUsers: AdminUser[];
  isLoading: boolean;
  lastPositionsUpdate: Date | null;
  lastSignalsUpdate: Date | null;
  autoRefreshInterval: NodeJS.Timeout | null;
  autoRefreshIntervalSignals: NodeJS.Timeout | null;
  error: string | null;
  fetchPositions: () => Promise<void>;
  fetchInitialSignals: () => Promise<void>;
  fetchAvailableSymbols: () => Promise<void>;
  fetchRobots: () => Promise<void>;
  fetchAllUsersWithTokens: () => Promise<void>;
  subscribeToSignals: () => () => void;
  addSignal: (signal: TradingSignal) => void;
  executeSignal: (signal: Omit<TradingSignal, 'id' | 'timestamp'>) => Promise<boolean>;
  closePosition: (ticket: number) => Promise<boolean>;
  forceClosePosition: (ticket: number, volume?: number) => Promise<boolean>;
  closeAllPositions: () => Promise<boolean>;
  closeAllProfitablePositions: () => Promise<boolean>;
  closeAllLosingPositions: () => Promise<boolean>;
  createRobot: (robot: Omit<Robot, 'id' | 'createdAt' | 'performance' | 'botToken'>) => Promise<Robot | null>;
  toggleRobot: (robotId: string) => Promise<void>;
  deleteRobot: (robotId: string) => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  startSignalsAutoRefresh: () => void;
  stopSignalsAutoRefresh: () => void;
  refreshAfterTrade: () => Promise<void>;
  forceRefreshPositions: () => Promise<void>;
  removeClosedPositionFromCache: (ticket: number) => void;
  verifyPositionExists: (ticket: number) => Promise<boolean>;
  updateRobotPerformance: (robotId: string, performance: Partial<Robot['performance']>) => Promise<void>;
}

// Generate unique bot token
function generateBotToken(): string {
  return 'bot_' + crypto.randomUUID().replace(/-/g, '');
}

// IMPROVED: Function to get MT5 symbol based on account type
// Now properly handles special symbols like XAUUSD, XAGUSD, etc.
function getMT5Symbol(symbol: string, accountType?: 'demo' | 'live' | 'prop'): string {
  // Special case: never modify precious metals, indices, or crypto
  if (symbol.startsWith('XAU') || 
      symbol.startsWith('XAG') || 
      symbol.startsWith('US30') || 
      symbol.startsWith('NAS100') || 
      symbol.startsWith('SPX500') ||
      symbol.startsWith('UK100') ||
      symbol.startsWith('GER30') ||
      symbol.startsWith('BTC') ||
      symbol.startsWith('ETH') ||
      symbol.startsWith('LTC') ||
      symbol.startsWith('XRP') ||
      symbol.startsWith('BCH') ||
      symbol.includes('OIL')) {
    return symbol;
  }
  
  // For prop accounts, append .raw if not already present and not a special symbol
  if (accountType === 'prop') {
    // Only append .raw if the symbol doesn't already have an extension
    if (!symbol.match(/\.(raw|m|c|pro|ecn|stp)$/i)) {
      return symbol + '.raw';
    }
  }
  
  // For live and demo accounts or if already has extension, return as-is
  return symbol;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  positions: [],
  signals: [],
  robots: [],
  availableSymbols: [],
  adminUsers: [],
  isLoading: false,
  lastPositionsUpdate: null,
  lastSignalsUpdate: null,
  autoRefreshInterval: null,
  autoRefreshIntervalSignals: null,
  error: null,

  fetchPositions: async () => {
    try {
      console.log('🔄 Fetching positions from MT5...');
      const positions = await mt5ApiService.getPositions();
      
      // Filter out any positions that might be stale or already closed
      const validPositions = positions.filter(pos => 
        pos.ticket && pos.ticket > 0 && pos.symbol && pos.volume > 0
      );
      
      console.log(`📊 Valid positions found: ${validPositions.length}`);
      
      // Check if any cached positions are missing from the fresh data
      const currentPositions = get().positions;
      const missingPositions = currentPositions.filter(cached => 
        !validPositions.some(fresh => fresh.ticket === cached.ticket)
      );
      
      if (missingPositions.length > 0) {
        console.log(`🧹 Found ${missingPositions.length} positions that are no longer on MT5:`, 
          missingPositions.map(p => `${p.ticket} (${p.symbol})`));
      }
      
     // Extract bot tokens from position comments if available
     const enhancedPositions = validPositions.map(pos => {
       // Check if comment contains a bot token (format: "bot_[uuid]")
       const botTokenMatch = pos.comment && pos.comment.match(/bot_([a-zA-Z0-9-]+)/);
       return {
         ...pos,
         botToken: botTokenMatch ? botTokenMatch[0] : undefined
       };
     });
     
     // Update floating P&L for robots based on open positions
     if (enhancedPositions.length > 0) {
       // Get current robots
       const robots = get().robots;
       
       // Calculate floating P&L by robot
       const floatingPnLByBotToken: Record<string, number> = {};
       
       // Initialize with 0 for all robots
       robots.forEach(robot => {
         floatingPnLByBotToken[robot.botToken] = 0;
       });
       
       // Add profit from each position to its associated robot
       enhancedPositions.forEach(pos => {
         if (pos.botToken && floatingPnLByBotToken[pos.botToken] !== undefined) {
           floatingPnLByBotToken[pos.botToken] += pos.profit;
         }
       });
       
       // Update robots with floating P&L
       const updatedRobots = robots.map(robot => {
         // Only update the displayed profit, not the stored profit in the database
         const floatingProfit = floatingPnLByBotToken[robot.botToken] || 0;
         return {
           ...robot,
           performance: {
             ...robot.performance,
             // Add floating profit to the stored profit for display
             currentProfit: robot.performance.profit + floatingProfit,
             floatingProfit: floatingProfit
           }
         };
       });
       
       // Update robots state with floating P&L
       set({ robots: updatedRobots });
     }
      set({ 
       positions: enhancedPositions, 
        lastPositionsUpdate: new Date(),
        error: null
      });
    } catch (error) {
      let errorMessage = 'Failed to fetch positions';
      
      if (error instanceof Error) {
        console.error('Failed to fetch positions:', error.message);
        
        if (error.message.includes('Authentication failed') || error.message.includes('Session expired')) {
          errorMessage = 'Session expired. Please login again.';
          toast.error(errorMessage);
          useAuthStore.getState().logout();
        } else {
          errorMessage = error.message;
          // Only show toast for actual errors, not routine failures
          if (!error.message.includes('timeout') && !error.message.includes('network')) {
            console.warn('Position fetch error (not showing toast):', error.message);
          }
        }
      } else {
        console.error('Failed to fetch positions:', error);
      }
      
      set({ 
        error: errorMessage,
        lastPositionsUpdate: new Date()
      });
    }
  },

  forceRefreshPositions: async () => {
    console.log('🔄 Force refreshing positions and account info...');
    
    // Set loading state to true at the start
    set({ isLoading: true });
    
    try {
      // Force refresh both positions and account info
      const authStore = useAuthStore.getState();
      
      // Clear the positions cache first to ensure fresh data
      set({ positions: [] });
      
      await Promise.all([
        get().fetchPositions(),
        authStore.refreshAccountInfo()
      ]);
      
      console.log('✅ Force refresh completed');
      toast.success('Positions and account info refreshed');
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      toast.error('Failed to refresh data');
    } finally {
      // Always set loading state to false when done
      set({ isLoading: false });
    }
  },

  // NEW: Remove a position from cache immediately
  removeClosedPositionFromCache: (ticket: number) => {
    console.log(`🧹 Removing position ${ticket} from cache`);
    set(state => ({
      positions: state.positions.filter(pos => pos.ticket !== ticket)
    }));
  },

  // NEW: Verify if a position still exists on MT5
  verifyPositionExists: async (ticket: number): Promise<boolean> => {
    try {
      console.log(`🔍 Verifying if position ${ticket} still exists on MT5...`);
      const positions = await mt5ApiService.getPositions();
      const exists = positions.some(pos => pos.ticket === ticket);
      console.log(`📊 Position ${ticket} exists on MT5: ${exists ? 'YES' : 'NO'}`);
      return exists;
    } catch (error) {
      console.error(`❌ Error verifying position ${ticket}:`, error);
      return false; // Assume it doesn't exist if we can't verify
    }
  },

  fetchAvailableSymbols: async () => {
    try {
      const symbols = await mt5ApiService.getSymbols();
      set({ availableSymbols: symbols });
      
      if (symbols.length > 0) {
        console.log(`Loaded ${symbols.length} symbols from broker:`, symbols.slice(0, 10), '...');
      } else {
        console.warn('No symbols received from broker');
      }
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
      
      // Fallback to common symbols if API fails
      const fallbackSymbols = [
        'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF',
        'EURJPY', 'EURGBP', 'GBPJPY', 'XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL',
        'US30', 'US500', 'NAS100', 'GER30', 'UK100', 'JPN225',
        'BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BCHUSD'
      ];
      
      set({ availableSymbols: fallbackSymbols });
      
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        toast.error('Session expired. Please login again.');
        useAuthStore.getState().logout();
      } else {
        toast('Could not load broker symbols. Using common symbols instead.');
      }
    }
  },

  fetchRobots: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.warn('No authenticated user found');
        return;
      }

      // Get the active MT5 account ID from auth store
      const { credentials } = useAuthStore.getState();
      const mt5AccountId = credentials?.mt5AccountId;
      
      console.log(`🔍 Fetching robots for user ${session.user.id} with MT5 account ID: ${mt5AccountId || 'None'}`);

      // Build the query
      let robotsQuery = supabase
        .from('trading_robots')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      // If we have an MT5 account ID, filter by it
      if (mt5AccountId) {
        robotsQuery = robotsQuery.eq('mt5_account_id', mt5AccountId);
      }

      const { data: robotsData, error } = await robotsQuery;

      if (error) {
        console.error('Error fetching robots:', error);
        toast.error('Failed to load trading robots');
        return;
      }

     // Get current positions to calculate floating P&L
     const positions = get().positions;
     
     // Create a map of bot tokens to floating P&L
     const floatingPnLByBotToken: Record<string, number> = {};
     
     // Calculate floating P&L for each robot based on open positions
     positions.forEach(position => {
       if (position.botToken) {
         if (!floatingPnLByBotToken[position.botToken]) {
           floatingPnLByBotToken[position.botToken] = 0;
         }
         floatingPnLByBotToken[position.botToken] += position.profit;
       }
     });
     
       // Calculate floating P&L for this robot
       const floatingProfit = floatingPnLByBotToken[robot.bot_token] || 0;
       
     console.log('📊 Floating P&L by bot token:', floatingPnLByBotToken);
      const robots: Robot[] = robotsData?.map(robot => ({
        id: robot.id,
        name: robot.name,
        symbol: robot.symbol, // Can be null for "All Symbols"
        isActive: robot.is_active || false,
        strategy: robot.strategy,
        riskLevel: robot.risk_level as 'LOW' | 'MEDIUM' | 'HIGH',
        maxLotSize: parseFloat(robot.max_lot_size),
        stopLoss: robot.stop_loss,
        takeProfit: robot.take_profit,
        createdAt: robot.created_at,
        botToken: robot.bot_token || generateBotToken(), // Generate if missing
        mt5AccountId: robot.mt5_account_id, // Include the MT5 account ID
        performance: {
          totalTrades: robot.total_trades || 0,
          winRate: parseFloat(robot.win_rate) || 0,
          // Add floating profit for real-time display
          currentProfit: parseFloat(robot.profit) + (floatingPnLByBotToken[robot.bot_token] || 0),
          floatingProfit: floatingPnLByBotToken[robot.bot_token] || 0,
          profit: parseFloat(robot.profit) || 0,
        },
      })) || [];

      set({ robots });
      console.log(`Loaded ${robots.length} robots from database for MT5 account: ${mt5AccountId || 'None'}`);
    } catch (error) {
      console.error('Error fetching robots:', error);
      toast.error('Failed to load trading robots');
    }
  },

  fetchAllUsersWithTokens: async () => {
    try {
      console.log('🔄 Fetching all users with token data for admin dashboard...');
      
      // Get all users from auth.users (this requires service role key)
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        // Fallback: try to get users from user_tokens table
        const { data: tokenUsers, error: tokenError } = await supabase
          .from('user_tokens')
          .select(`
            user_id,
            balance,
            earned,
            spent,
            created_at
          `);
        
        if (tokenError) {
          console.error('❌ Error fetching token users:', tokenError);
          toast.error('Failed to load user data');
          return;
        }
        
        // Create admin users from token data only
        const adminUsers: AdminUser[] = tokenUsers?.map(tokenUser => ({
          id: tokenUser.user_id,
          email: 'Unknown', // Can't get email without admin access
          created_at: tokenUser.created_at,
          tokens: {
            balance: tokenUser.balance,
            earned: tokenUser.earned,
            spent: tokenUser.spent
          }
        })) || [];
        
        set({ adminUsers });
        console.log(`✅ Loaded ${adminUsers.length} users from token data`);
        return;
      }

      // Get token data for all users
      const userIds = users.users.map(user => user.id);
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
        .select('*')
        .in('user_id', userIds);

      if (tokenError) {
        console.error('❌ Error fetching token data:', tokenError);
      }

      // Combine user data with token data
      const adminUsers: AdminUser[] = users.users.map(user => {
        const userTokens = tokenData?.find(token => token.user_id === user.id);
        
        return {
          id: user.id,
          email: user.email || 'No email',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          tokens: userTokens ? {
            balance: userTokens.balance,
            earned: userTokens.earned,
            spent: userTokens.spent
          } : null
        };
      });

      set({ adminUsers });
      console.log(`✅ Loaded ${adminUsers.length} users with token data for admin dashboard`);
    } catch (error) {
      console.error('❌ Error fetching all users with tokens:', error);
      toast.error('Failed to load admin data');
    }
  },

  fetchInitialSignals: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.warn('No authenticated user found for signals fetch');
        return;
      }

      const { data: signalsData, error } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching signals:', error);
        return;
      }

      const signals: TradingSignal[] = signalsData?.map(signal => ({
        id: signal.id,
        symbol: signal.symbol,
        action: signal.action as 'BUY' | 'SELL' | 'CLOSE',
        volume: parseFloat(signal.volume),
        price: signal.price ? parseFloat(signal.price) : undefined,
        stopLoss: signal.stop_loss ? parseFloat(signal.stop_loss) : undefined,
        takeProfit: signal.take_profit ? parseFloat(signal.take_profit) : undefined,
        timestamp: signal.created_at,
        source: signal.source as 'tradingview' | 'manual',
        botToken: signal.bot_token, // Include bot token
        ticket: signal.ticket, // Include ticket for targeted position closing
      })) || [];

      set({ 
        signals,
        lastSignalsUpdate: new Date()
      });
      
      console.log(`📊 Fetched ${signals.length} signals for user ${session.user.id}`);
    } catch (error) {
      console.error('Error fetching initial signals:', error);
    }
  },

  subscribeToSignals: () => {
    const channel = supabase
      .channel('trading_signals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trading_signals'
        },
        (payload) => {
          const newSignal = payload.new;
          const signal: TradingSignal = {
            id: newSignal.id,
            symbol: newSignal.symbol,
            action: newSignal.action as 'BUY' | 'SELL' | 'CLOSE',
            volume: parseFloat(newSignal.volume),
            price: newSignal.price ? parseFloat(newSignal.price) : undefined,
            stopLoss: newSignal.stop_loss ? parseFloat(newSignal.stop_loss) : undefined,
            takeProfit: newSignal.take_profit ? parseFloat(newSignal.take_profit) : undefined,
            timestamp: newSignal.created_at,
            source: newSignal.source as 'tradingview' | 'manual',
            botToken: newSignal.bot_token,
            ticket: newSignal.ticket, // Include ticket for targeted position closing
          };

          set(state => ({
            signals: [signal, ...state.signals.slice(0, 49)], // Keep last 50 signals
            lastSignalsUpdate: new Date()
          }));

          // Only show toast for actual trading signals, not close signals
          if (signal.action !== 'CLOSE') {
            toast.success(`New ${signal.action} signal received for ${signal.symbol} - Auto-executed`);
          } else {
            console.log(`📊 Close signal received for ${signal.symbol}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trading_signals'
        },
        (payload) => {
          const updatedSignal = payload.new;
          
          set(state => ({
            signals: state.signals.map(signal => 
              signal.id === updatedSignal.id 
                ? {
                    ...signal,
                    timestamp: updatedSignal.created_at,
                  }
                : signal
            ),
            lastSignalsUpdate: new Date()
          }));
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  addSignal: (signal: TradingSignal) => {
    set(state => ({
      signals: [signal, ...state.signals.slice(0, 99)], // Keep last 100 signals
      lastSignalsUpdate: new Date()
    }));
  },

  executeSignal: async (signalData: Omit<TradingSignal, 'id' | 'timestamp'>): Promise<boolean> => {
    try {
      console.log('🔄 Executing signal:', signalData);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast.error('You must be logged in to execute trades');
        return false;
      }

      // Get account type from auth store
      const authStore = useAuthStore.getState();
      const accountType = authStore.accountInfo?.accountType;
      
      console.log(`🏦 Account type: ${accountType}`);

      // First, save the signal to database
      const { data: savedSignal, error: signalError } = await supabase
        .from('trading_signals')
        .insert({
          user_id: session.user.id,
          symbol: signalData.symbol,
          action: signalData.action,
          volume: signalData.volume,
          price: signalData.price,
          stop_loss: signalData.stopLoss,
          take_profit: signalData.takeProfit,
          source: signalData.source || 'manual',
          status: 'pending',
          bot_token: signalData.botToken,
          ticket: signalData.ticket // Save ticket for targeted position closing
        })
        .select()
        .single();

      if (signalError) {
        console.error('Error saving signal:', signalError);
        toast.error('Failed to save signal');
        return false;
      }

      // Find the robot that should process this signal
      let targetRobot: Robot | undefined;
      
      if (signalData.botToken) {
        // If botToken is provided, find the specific robot
        targetRobot = get().robots.find(r => r.botToken === signalData.botToken && r.isActive);
        console.log(`🤖 Looking for robot with token ${signalData.botToken}:`, targetRobot ? `Found: ${targetRobot.name}` : 'Not found');
      } else {
        // Otherwise, find a robot that matches the symbol or has null symbol
        targetRobot = get().robots.find(r => 
          r.isActive && (r.symbol === signalData.symbol || r.symbol === null)
        );
        console.log(`🤖 Looking for robot matching symbol ${signalData.symbol}:`, targetRobot ? `Found: ${targetRobot.name}` : 'Not found');
      }

      let orderResult: any;
      let success = false;

      // Handle different signal actions
      if (signalData.action === 'CLOSE') {
        // Check if a specific ticket was provided for targeted closing
        if (signalData.ticket) {
          console.log(`Closing specific position with ticket ${signalData.ticket}`);
          
          // Verify the position exists before attempting to close
          const exists = await get().verifyPositionExists(signalData.ticket);
          
          if (!exists) {
            console.log(`Position ${signalData.ticket} not found or already closed`);
            orderResult = { retcode: 10009, comment: 'Position already closed or not found' };
            success = true;
          } else {
            // Get position details before closing for performance tracking
            const positionToClose = get().positions.find(p => p.ticket === signalData.ticket);
            const positionProfit = positionToClose?.profit || 0;
            
            // Close the specific position
            success = await get().forceClosePosition(signalData.ticket);
            orderResult = { 
              retcode: success ? 10009 : 10004, 
              comment: success ? `Closed position ${signalData.ticket}` : `Failed to close position ${signalData.ticket}`,
              profit: positionProfit // Store the actual profit for performance tracking
            };
          }
        } else {
          // For CLOSE signals without a ticket, find and close positions for the specified symbol
          const currentPositions = get().positions;
          const positionsToClose = currentPositions.filter(pos => pos.symbol === getMT5Symbol(signalData.symbol, accountType));
          
          if (positionsToClose.length === 0) {
            console.log(`No open positions found for ${signalData.symbol} to close`);
            orderResult = { retcode: 10009, comment: 'No positions to close' };
            success = true;
          } else {
            console.log(`Closing ${positionsToClose.length} positions for ${signalData.symbol}`);
            
            // Calculate total profit before closing for performance tracking
            const totalProfit = positionsToClose.reduce((sum, pos) => sum + pos.profit, 0);
            
            let closedCount = 0;
            for (const position of positionsToClose) {
              const closeSuccess = await get().forceClosePosition(position.ticket, position.volume);
              if (closeSuccess) closedCount++;
            }
            
            success = closedCount > 0;
            orderResult = { 
              retcode: success ? 10009 : 10004, 
              comment: success ? `Closed ${closedCount} of ${positionsToClose.length} positions` : 'Failed to close positions',
              profit: totalProfit // Store the actual total profit for performance tracking
            };
          }
        }
      } else {
        // IMPROVED: Get MT5 symbol based on account type
        let mt5Symbol: string = getMT5Symbol(signalData.symbol, accountType);
        
        if (mt5Symbol !== signalData.symbol) {
          console.log(`🔄 Symbol adjusted for ${accountType} account: "${signalData.symbol}" -> "${mt5Symbol}"`);
        }
        
       // Prepare comment with bot token for position tracking
       let orderComment = signalData.botToken ? `bot_${signalData.botToken}` : '';
       
       // Add strategy name if available
       if (signalData.source && signalData.source !== 'manual') {
         orderComment = orderComment ? `${orderComment} - ${signalData.source}` : signalData.source;
       }
       
       // Add robot name if available
       if (targetRobot?.name) {
         orderComment = orderComment ? `${orderComment} - ${targetRobot.name}` : targetRobot.name;
       }
       
        // For BUY/SELL signals, execute the trade via MT5 API using the MT5 symbol
        orderResult = await mt5ApiService.sendOrder({
          symbol: mt5Symbol, // Use the account-type-specific symbol
          action: signalData.action,
          volume: signalData.volume,
          price: signalData.price,
          sl: signalData.stopLoss,
          tp: signalData.takeProfit,
         comment: orderComment
        });
        
        success = orderResult.retcode === 10009;
      }

      console.log('📥 Signal execution result:', orderResult);

      // Update signal status in database
      await supabase
        .from('trading_signals')
        .update({
          status: success ? 'executed' : 'failed',
          executed_at: success ? new Date().toISOString() : null
        })
        .eq('id', savedSignal.id);

      if (success) {
        // Create the signal object for local state
        const executedSignal: TradingSignal = {
          id: savedSignal.id,
          symbol: signalData.symbol,
          action: signalData.action,
          volume: signalData.volume,
          price: signalData.price,
          stopLoss: signalData.stopLoss,
          takeProfit: signalData.takeProfit,
          timestamp: savedSignal.created_at,
          source: signalData.source || 'manual',
          botToken: signalData.botToken,
          ticket: signalData.ticket
        };

        // Add to local state
        get().addSignal(executedSignal);

        // Refresh positions and account info
        await get().refreshAfterTrade();

        if (signalData.action === 'CLOSE') {
          if (signalData.ticket) {
            toast.success(`Close signal executed successfully for position #${signalData.ticket}`);
          } else {
            toast.success(`Close signal executed successfully for ${signalData.symbol}`);
          }
        } else {
          // Initialize mt5Symbol for the success message
          let mt5Symbol: string = getMT5Symbol(signalData.symbol, accountType);
          const symbolMessage = mt5Symbol !== signalData.symbol ? 
            `${signalData.symbol} (${mt5Symbol})` : signalData.symbol;
          toast.success(`${signalData.action} order executed successfully for ${symbolMessage}`);
        }
        
        // Update robot performance if a robot was found
        if (targetRobot) {
          console.log(`🤖 Updating performance for robot: ${targetRobot.name} (${targetRobot.id})`);
          
          // Increment total trades
          const newTotalTrades = targetRobot.performance.totalTrades + 1;
          
          // Calculate win/loss based on actual trade result
          let isWin = false;
          let profitChange = 0;
          
          if (signalData.action === 'CLOSE') {
            // For CLOSE actions, use the actual profit from the closed position(s)
            profitChange = orderResult.profit || 0;
            isWin = profitChange > 0;
            console.log(`📊 CLOSE action with actual profit: ${profitChange}, isWin: ${isWin}`);
          } else {
            // For BUY/SELL actions, we'll need to track the position and update later
            // For now, we'll just increment the trade count without changing profit/win rate
            console.log(`📊 ${signalData.action} action - position opened, profit will be tracked on close`);
            
            // We can store the ticket number for later reference
            const ticketNumber = orderResult.ticket || orderResult.order;
            if (ticketNumber) {
              console.log(`📊 New position opened with ticket: ${ticketNumber}`);
            }
          }
          
          // Calculate new win rate
          const totalWins = isWin 
            ? Math.round(targetRobot.performance.winRate * targetRobot.performance.totalTrades / 100) + 1
            : Math.round(targetRobot.performance.winRate * targetRobot.performance.totalTrades / 100);
          
          // Avoid division by zero for new robots
          const newWinRate = newTotalTrades > 0 ? (totalWins / newTotalTrades) * 100 : 0;
          
          // Update profit with actual P&L
          const newProfit = targetRobot.performance.profit + profitChange;
          
          console.log(`🤖 Performance update details:`, {
            robotId: targetRobot.id,
            oldTotalTrades: targetRobot.performance.totalTrades,
            newTotalTrades,
            oldWinRate: targetRobot.performance.winRate,
            newWinRate,
            oldProfit: targetRobot.performance.profit,
            newProfit,
            profitChange,
            isWin,
            action: signalData.action
          });
          
          // Update robot performance in database and local state
          await get().updateRobotPerformance(targetRobot.id, {
            totalTrades: newTotalTrades,
            winRate: newWinRate,
            profit: newProfit
          });
        } else {
          console.log(`⚠️ No robot found to update performance for signal:`, {
            symbol: signalData.symbol,
            action: signalData.action,
            botToken: signalData.botToken
          });
        }
        
        return true;
      } else {
        console.error('Signal execution failed:', orderResult);
        const actionText = signalData.action === 'CLOSE' ? 'close positions' : `execute ${signalData.action} order`;
        toast.error(`Failed to ${actionText} for ${signalData.symbol}: ${orderResult.comment || 'Unknown error'}`);
        return false;
      }

    } catch (error) {
      console.error('Error executing signal:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication failed') || error.message.includes('Session expired')) {
          toast.error('Session expired. Please login again.');
          useAuthStore.getState().logout();
        } else {
          toast.error(`Failed to execute signal: ${error.message}`);
        }
      } else {
        toast.error('Failed to execute signal');
      }
      
      return false;
    }
  },

  closePosition: async (ticket: number) => {
    try {
      console.log('🔄 Closing position:', ticket);
      
      // Immediately remove from cache for instant UI feedback
      get().removeClosedPositionFromCache(ticket);
      
      // Check if position still exists before attempting to close
      const positionExists = await get().verifyPositionExists(ticket);
      
      if (!positionExists) {
        console.log(`⚠️ Position ${ticket} not found on MT5 - already closed`);
        toast.success(`Position ${ticket} is already closed`);
        
        // Force refresh to sync with MT5
        await get().forceRefreshPositions();
        return true;
      }
      
      const result = await mt5ApiService.closePosition(ticket);
      console.log('📥 Close position result:', result);
      
      const success = result.retcode === 10009;
      
      if (success) {
        // Immediately refresh positions and account info
        await get().refreshAfterTrade();
        toast.success(`Position ${ticket} closed successfully`);
      } else {
        console.error('Close position failed:', result);
        toast.error(`Failed to close position ${ticket}: ${result.message || 'Unknown error'}`);
        
        // If close failed, we need to restore the position in cache
        // Force refresh to get the current state
        await get().forceRefreshPositions();
      }
      
      return success;
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a "position not found" error - treat as success
        if (error.message.includes('position not found') || 
            error.message.includes('already closed') ||
            error.message.includes('POSITION_NOT_EXISTS')) {
          console.log(`✅ Position ${ticket} was already closed`);
          toast.success(`Position ${ticket} was already closed`);
          
          // Force refresh to sync with MT5
          await get().forceRefreshPositions();
          return true;
        }
        
        if (error.message.includes('Authentication failed') || error.message.includes('Session expired')) {
          toast.error('Session expired. Please login again.');
          useAuthStore.getState().logout();
        } else {
          toast.error(`Failed to close position ${ticket}: ${error.message}`);
        }
        
        // If there was an error, restore the position in cache
        await get().forceRefreshPositions();
      } else {
        console.error('Failed to close position:', error);
        toast.error(`Failed to close position ${ticket}`);
        
        // If there was an error, restore the position in cache
        await get().forceRefreshPositions();
      }
      
      return false;
    }
  },

  forceClosePosition: async (ticket: number, volume?: number) => {
    try {
      console.log(`🔄 Force closing position ${ticket} with enhanced volume detection...`);
      
      // Immediately remove from cache for instant UI feedback
      get().removeClosedPositionFromCache(ticket);
      
      // Get position details before closing to capture profit
      let positionProfit = 0;
      const positionToClose = get().positions.find(p => p.ticket === ticket);
      if (positionToClose) {
        positionProfit = positionToClose.profit;
        console.log(`📊 Position ${ticket} has profit ${positionProfit} before closing`);
      }
      
      // Use the enhanced closePosition method from mt5ApiService
      // which now handles multiple volume formats internally and returns profit
      const result = await mt5ApiService.closePosition(ticket, volume);
      
      if (result.retcode === 10009) {
        console.log(`✅ Position ${ticket} closed successfully using ${result.formatDescription || 'auto-detected format'}`);
        console.log(`📊 Position ${ticket} closed with profit: ${result.profit !== undefined ? result.profit : positionProfit}`);
        
        await get().refreshAfterTrade();
        toast.success(`Position ${ticket} closed successfully`);
        return true;
      } else {
        console.error(`❌ Failed to close position ${ticket}:`, result);
        toast.error(`Failed to close position ${ticket}: ${result.message || 'Unknown error'}`);
        
        // If close failed, restore the position in cache
        await get().forceRefreshPositions();
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Force close failed for position ${ticket}:`, error);
      
      if (error instanceof Error) {
        // Check if it's a "position not found" error - treat as success
        if (error.message.includes('position not found') || 
            error.message.includes('already closed') ||
            error.message.includes('POSITION_NOT_EXISTS')) {
          console.log(`✅ Position ${ticket} was already closed`);
          toast.success(`Position ${ticket} was already closed`);
          
          // Force refresh to sync with MT5
          await get().forceRefreshPositions();
          return true;
        }
        
        toast.error(`Failed to close position ${ticket}: ${error.message}`);
      } else {
        toast.error(`Failed to close position ${ticket}`);
      }
      
      // If there was an error, restore the position in cache
      await get().forceRefreshPositions();
      return false;
    }
  },

  closeAllPositions: async () => {
    const { positions } = get();
    if (positions.length === 0) {
      toast('No positions to close');
      return false;
    }

    let successCount = 0;
    const totalPositions = positions.length;

    for (const position of positions) {
      const success = await get().forceClosePosition(position.ticket, position.volume);
      if (success) successCount++;
    }

    if (successCount > 0) {
      toast.success(`Closed ${successCount} of ${totalPositions} positions`);
      return true;
    } else {
      toast.error('Failed to close any positions');
      return false;
    }
  },

  closeAllProfitablePositions: async () => {
    const { positions } = get();
    const profitablePositions = positions.filter(p => p.profit > 0);
    
    if (profitablePositions.length === 0) {
      toast('No profitable positions to close');
      return false;
    }

    let successCount = 0;
    const totalPositions = profitablePositions.length;

    for (const position of profitablePositions) {
      const success = await get().forceClosePosition(position.ticket, position.volume);
      if (success) successCount++;
    }

    if (successCount > 0) {
      toast.success(`Closed ${successCount} of ${totalPositions} profitable positions`);
      return true;
    } else {
      toast.error('Failed to close any profitable positions');
      return false;
    }
  },

  closeAllLosingPositions: async () => {
    const { positions } = get();
    const losingPositions = positions.filter(p => p.profit < 0);
    
    if (losingPositions.length === 0) {
      toast('No losing positions to close');
      return false;
    }

    let successCount = 0;
    const totalPositions = losingPositions.length;

    for (const position of losingPositions) {
      const success = await get().forceClosePosition(position.ticket, position.volume);
      if (success) successCount++;
    }

    if (successCount > 0) {
      toast.success(`Closed ${successCount} of ${totalPositions} losing positions`);
      return true;
    } else {
      toast.error('Failed to close any losing positions');
      return false;
    }
  },

  createRobot: async (robotData): Promise<Robot | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast.error('You must be logged in to create a robot');
        return null;
      }

      // Get the active MT5 account ID from auth store
      const { credentials } = useAuthStore.getState();
      const mt5AccountId = credentials?.mt5AccountId;
      
      if (!mt5AccountId) {
        console.warn('No active MT5 account ID found when creating robot');
        toast.error('No active MT5 account found. Please reconnect your broker.');
        return null;
      }

      // Generate unique bot token
      const botToken = generateBotToken();

      // Prepare robot data for database
      const dbRobotData = {
        user_id: session.user.id,
        mt5_account_id: mt5AccountId, // Link robot to specific MT5 account
        name: robotData.name,
        symbol: robotData.symbol, // Can be null for "All Symbols"
        strategy: robotData.strategy,
        risk_level: robotData.riskLevel,
        max_lot_size: robotData.maxLotSize,
        stop_loss: robotData.stopLoss,
        take_profit: robotData.takeProfit,
        is_active: robotData.isActive || false,
        bot_token: botToken, // Store unique bot token
        total_trades: 0,
        win_rate: 0,
        profit: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🤖 Creating new robot with data:', {
        ...dbRobotData,
        mt5_account_id: mt5AccountId
      });

      const { data: newRobot, error } = await supabase
        .from('trading_robots')
        .insert(dbRobotData)
        .select()
        .single();

      if (error) {
        console.error('Error creating robot:', error);
        toast.error('Failed to create robot: ' + error.message);
        return null;
      }

      // Convert database format to Robot interface
      const robot: Robot = {
        id: newRobot.id,
        name: newRobot.name,
        symbol: newRobot.symbol,
        isActive: newRobot.is_active,
        strategy: newRobot.strategy,
        riskLevel: newRobot.risk_level as 'LOW' | 'MEDIUM' | 'HIGH',
        maxLotSize: parseFloat(newRobot.max_lot_size),
        stopLoss: newRobot.stop_loss,
        takeProfit: newRobot.take_profit,
        createdAt: newRobot.created_at,
        botToken: newRobot.bot_token,
        mt5AccountId: newRobot.mt5_account_id, // Include the MT5 account ID
        performance: {
          totalTrades: newRobot.total_trades || 0,
          winRate: parseFloat(newRobot.win_rate) || 0,
          profit: parseFloat(newRobot.profit) || 0,
        },
      };

      // Update local state
      set(state => ({
        robots: [robot, ...state.robots]
      }));

      const symbolDisplay = robot.symbol || 'All Symbols';
      toast.success(`Robot "${robot.name}" created successfully for ${symbolDisplay}`);
      
      return robot;
    } catch (error) {
      console.error('Error creating robot:', error);
      toast.error('Failed to create robot');
      return null;
    }
  },

  toggleRobot: async (robotId: string) => {
    try {
      const robot = get().robots.find(r => r.id === robotId);
      if (!robot) {
        toast.error('Robot not found');
        return;
      }

      // Get the active MT5 account ID from auth store
      const { credentials } = useAuthStore.getState();
      const mt5AccountId = credentials?.mt5AccountId;
      
      if (!mt5AccountId) {
        console.warn('No active MT5 account ID found when toggling robot');
        toast.error('No active MT5 account found. Please reconnect your broker.');
        return;
      }

      const newActiveState = !robot.isActive;

      console.log(`🤖 CRITICAL: Toggling robot "${robot.name}" from ${robot.isActive ? 'ACTIVE' : 'INACTIVE'} to ${newActiveState ? 'ACTIVE' : 'INACTIVE'}`);

      // Update the robot in the database, filtering by both robot ID and MT5 account ID
      const { error } = await supabase
        .from('trading_robots')
        .update({ 
          is_active: newActiveState,
          updated_at: new Date().toISOString()
        })
        .eq('id', robotId)
        .eq('mt5_account_id', mt5AccountId);

      if (error) {
        console.error('❌ Error toggling robot in database:', error);
        toast.error('Failed to update robot status');
        return;
      }

      console.log(`✅ Robot "${robot.name}" successfully updated in database to ${newActiveState ? 'ACTIVE' : 'INACTIVE'}`);

      // Update local state
      set(state => ({
        robots: state.robots.map(r =>
          r.id === robotId
            ? { ...r, isActive: newActiveState }
            : r
        )
      }));

      const action = newActiveState ? 'activated' : 'deactivated';
      toast.success(`Robot "${robot.name}" ${action} successfully`);
      
      // Log the current state for debugging
      console.log(`🔍 Robot "${robot.name}" current state in UI: ${newActiveState ? 'ACTIVE' : 'INACTIVE'}`);
      
    } catch (error) {
      console.error('❌ Error toggling robot:', error);
      toast.error('Failed to update robot status');
    }
  },

  deleteRobot: async (robotId: string) => {
    try {
      const robot = get().robots.find(r => r.id === robotId);
      if (!robot) {
        toast.error('Robot not found');
        return;
      }

      // Get the active MT5 account ID from auth store
      const { credentials } = useAuthStore.getState();
      const mt5AccountId = credentials?.mt5AccountId;
      
      if (!mt5AccountId) {
        console.warn('No active MT5 account ID found when deleting robot');
        toast.error('No active MT5 account found. Please reconnect your broker.');
        return;
      }

      // Delete the robot from the database, filtering by both robot ID and MT5 account ID
      const { error } = await supabase
        .from('trading_robots')
        .delete()
        .eq('id', robotId)
        .eq('mt5_account_id', mt5AccountId);

      if (error) {
        console.error('Error deleting robot:', error);
        toast.error('Failed to delete robot');
        return;
      }

      // Update local state
      set(state => ({
        robots: state.robots.filter(r => r.id !== robotId)
      }));

      toast.success(`Robot "${robot.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting robot:', error);
      toast.error('Failed to delete robot');
    }
  },

  // New method to update robot performance metrics with enhanced logging
  updateRobotPerformance: async (robotId: string, performance: Partial<Robot['performance']>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.warn('No authenticated user found');
        return;
      }

      // Get the active MT5 account ID from auth store
      const { credentials } = useAuthStore.getState();
      const mt5AccountId = credentials?.mt5AccountId;
      
      if (!mt5AccountId) {
        console.warn('No active MT5 account ID found when updating robot performance');
        return;
      }

      // Get current robot data
      const robot = get().robots.find(r => r.id === robotId);
      if (!robot) {
        console.warn(`Robot with ID ${robotId} not found`);
        return;
      }

      // Prepare update data
      const updateData: Record<string, any> = {};
      if (performance.totalTrades !== undefined) {
        updateData.total_trades = performance.totalTrades;
      }
      if (performance.winRate !== undefined) {
        updateData.win_rate = performance.winRate;
      }
      if (performance.profit !== undefined) {
        updateData.profit = performance.profit;
      }
      updateData.updated_at = new Date().toISOString();

      // Enhanced logging before update
      console.log(`🔄 [updateRobotPerformance] Updating robot ${robotId} performance with data:`, updateData);
      console.log(`🔄 [updateRobotPerformance] Robot details: name=${robot.name}, symbol=${robot.symbol}, mt5AccountId=${mt5AccountId}`);
      console.log(`🔄 [updateRobotPerformance] Current performance: totalTrades=${robot.performance.totalTrades}, winRate=${robot.performance.winRate}, profit=${robot.performance.profit}`);
      console.log(`🔄 [updateRobotPerformance] New performance: totalTrades=${performance.totalTrades}, winRate=${performance.winRate}, profit=${performance.profit}`);

      // Update in database, filtering by both robot ID and MT5 account ID
      const { data, error } = await supabase
        .from('trading_robots')
        .update(updateData)
        .eq('id', robotId)
        .eq('mt5_account_id', mt5AccountId)
        .select();

      // Log the response
      if (error) {
        console.error('❌ [updateRobotPerformance] Error updating robot performance:', error);
        console.error('❌ [updateRobotPerformance] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return;
      } else {
        console.log(`✅ [updateRobotPerformance] Database update successful:`, data);
      }

      // Update local state
      set(state => ({
        robots: state.robots.map(r => 
          r.id === robotId 
            ? { 
                ...r, 
                performance: { 
                  ...r.performance,
                  ...performance,
                 // Preserve floating profit when updating stored profit
                 currentProfit: (performance.profit || r.performance.profit) + (r.performance.floatingProfit || 0),
                } 
              }
            : r
        )
      }));

      console.log(`✅ [updateRobotPerformance] Updated performance for robot ${robotId}:`, performance);
      console.log(`✅ [updateRobotPerformance] Local state updated successfully`);
    } catch (error) {
      console.error('❌ [updateRobotPerformance] Unexpected error updating robot performance:', error);
      if (error instanceof Error) {
        console.error('❌ [updateRobotPerformance] Error message:', error.message);
        console.error('❌ [updateRobotPerformance] Error stack:', error.stack);
      }
    }
  },

  startAutoRefresh: () => {
    // Clear any existing interval
    get().stopAutoRefresh();
    
    // Set up auto-refresh every 100ms for ultra-fast position updates
    const interval = setInterval(() => {
      get().fetchPositions();
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

  startSignalsAutoRefresh: () => {
    // Clear any existing signals interval
    get().stopSignalsAutoRefresh();
    
    // Set up auto-refresh every 10 seconds for signals
    const interval = setInterval(() => {
      get().fetchInitialSignals();
    }, 10000);
    
    set({ autoRefreshIntervalSignals: interval });
    console.log('🔄 Started signals auto-refresh (every 10 seconds)');
  },

  stopSignalsAutoRefresh: () => {
    const { autoRefreshIntervalSignals } = get();
    if (autoRefreshIntervalSignals) {
      clearInterval(autoRefreshIntervalSignals);
      set({ autoRefreshIntervalSignals: null });
      console.log('⏹️ Stopped signals auto-refresh');
    }
  },

  refreshAfterTrade: async () => {
    // Immediately refresh both positions and account info after a trade
    const authStore = useAuthStore.getState();
    
    console.log('🔄 Refreshing after trade execution...');
    
    // Clear positions cache first to ensure fresh data
    set({ positions: [] });
    
    // Run both refreshes in parallel for faster updates
    await Promise.all([
      get().fetchPositions(),
      authStore.refreshAccountInfo()
    ]);
    
    console.log('✅ Post-trade refresh completed');
  },
}));