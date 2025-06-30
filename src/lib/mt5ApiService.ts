import axios from 'axios';

// Define types
interface MT5Credentials {
  accountNumber: string;
  password: string;
  serverName: string;
}

interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  accountNumber: string;
  accountName: string;
  serverName: string;
  leverage: number;
  profit: number;
  credit: number;
}

interface Position {
  ticket: number;
  symbol: string;
  type: 'Buy' | 'Sell';
  volume: number;
  openPrice: number;
  currentPrice?: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  comment: string;
}

interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  time: string;
}

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ConnectionResponse {
  success: boolean;
  token?: string;
  message: string;
}

// MT5 API Service
class MT5ApiService {
  private apiUrl: string;
  private apiKey: string;
  private token: string | null = null;

  constructor() {
    this.apiUrl = import.meta.env.VITE_MT5_API_URL || 'https://mt5full2.mtapi.io';
    this.apiKey = import.meta.env.VITE_MT5_API_KEY || '';
    
    // Try to load token from localStorage
    this.token = localStorage.getItem('mt5Token');
    
    // Validate API key on initialization
    this.validateApiKey();
  }

  // Validate API key configuration
  private validateApiKey(): void {
    if (!this.apiKey) {
      console.error('❌ MT5 API Key is missing from environment variables');
      console.error('💡 Please check your .env file contains VITE_MT5_API_KEY');
    } else if (this.apiKey.length < 10) {
      console.error('❌ MT5 API Key appears to be invalid (too short)');
      console.error('💡 Please verify your VITE_MT5_API_KEY in .env file');
    } else {
      console.log('✅ MT5 API Key loaded successfully');
    }
  }

  // Store token for later use
  private storeToken(token: string): void {
    this.token = token;
    localStorage.setItem('mt5Token', token);
  }

  // Get stored token
  public getStoredToken(): string | null {
    return this.token;
  }

  // Connect to MT5 server
  public async connect(credentials: MT5Credentials): Promise<ConnectionResponse> {
    try {
      console.log('🔄 Connecting to MT5 server...');
      
      // Validate API key before making request
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Invalid MT5 API key. Please check your .env file contains VITE_MT5_API_KEY and restart the development server.'
        };
      }

      if (this.apiKey.length < 10) {
        return {
          success: false,
          message: 'MT5 API key appears to be invalid. Please verify your VITE_MT5_API_KEY in .env file.'
        };
      }
      
      console.log('🔑 Using API URL:', this.apiUrl);
      console.log('🔑 API Key configured:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NO');
      console.log('📋 Connection parameters:', {
        user: credentials.accountNumber,
        server: credentials.serverName,
        passwordLength: credentials.password.length
      });
      
      const response = await axios.get(`${this.apiUrl}/ConnectEx`, {
        params: {
          id: this.apiKey,
          user: credentials.accountNumber,
          password: credentials.password,
          server: credentials.serverName
        },
        timeout: 30000, // 30 second timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });
      
      console.log('✅ MT5 connection response:', response.data);
      
      if (typeof response.data === 'string' && response.data.length > 10) {
        // Successful connection returns a token
        this.storeToken(response.data);
        return {
          success: true,
          token: response.data,
          message: 'Connected successfully'
        };
      } else {
        return {
          success: false,
          message: response.data || 'Failed to connect to MT5 server'
        };
      }
    } catch (error) {
      console.error('❌ MT5 connection error:', error);
      
      // Enhanced error handling for different types of errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            success: false,
            message: 'Invalid MT5 API key. Please check your .env file contains the correct VITE_MT5_API_KEY and restart the development server.'
          };
        } else if (error.response?.status === 403) {
          return {
            success: false,
            message: 'MT5 API access forbidden. Please verify your API key permissions.'
          };
        } else if (error.response?.status === 404) {
          return {
            success: false,
            message: 'MT5 API endpoint not found. Please check the API URL configuration.'
          };
        } else if (error.response?.status >= 500) {
          return {
            success: false,
            message: 'MT5 API server error. Please try again later or contact support.'
          };
        } else if (error.code === 'ECONNREFUSED') {
          return {
            success: false,
            message: 'Cannot connect to MT5 API server. Please check your internet connection.'
          };
        } else if (error.code === 'ETIMEDOUT') {
          return {
            success: false,
            message: 'Connection to MT5 API timed out. Please try again.'
          };
        } else {
          return {
            success: false,
            message: `MT5 API connection failed: ${error.response?.data || error.message}`
          };
        }
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }

  // Disconnect from MT5 server
  public disconnect(): void {
    this.token = null;
    localStorage.removeItem('mt5Token');
  }

  // Get account information
  public async getAccountInfo(): Promise<AccountInfo | null> {
    if (!this.token) {
      console.error('❌ No MT5 token available');
      return null;
    }

    try {
      console.log('🔄 Fetching MT5 account info...');
      
      // First, get account summary
      const summaryResponse = await axios.get(`${this.apiUrl}/AccountSummary`, {
        params: { id: this.token },
        timeout: 15000
      });
      
      // Then, get account details
      const detailsResponse = await axios.get(`${this.apiUrl}/AccountDetails`, {
        params: { id: this.token },
        timeout: 15000
      });
      
      console.log('✅ MT5 account summary:', summaryResponse.data);
      console.log('✅ MT5 account details:', detailsResponse.data);
      
      // Combine data from both endpoints
      const summary = summaryResponse.data;
      const details = detailsResponse.data;
      
      return {
        balance: parseFloat(summary.Balance || '0'),
        equity: parseFloat(summary.Equity || '0'),
        margin: parseFloat(summary.Margin || '0'),
        freeMargin: parseFloat(summary.FreeMargin || '0'),
        marginLevel: parseFloat(summary.MarginLevel || '0'),
        profit: parseFloat(summary.Profit || '0'),
        credit: parseFloat(summary.Credit || '0'),
        currency: details.Currency || 'USD',
        accountNumber: details.Login || '',
        accountName: details.Name || '',
        serverName: details.Server || '',
        leverage: parseInt(details.Leverage || '100')
      };
    } catch (error) {
      console.error('❌ Error fetching MT5 account info:', error);
      
      // Handle authentication errors specifically
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Authentication failed. MT5 session may have expired. Please reconnect.');
      }
      
      return null;
    }
  }

  // Get open positions
  public async getPositions(): Promise<Position[]> {
    if (!this.token) {
      console.error('❌ No MT5 token available');
      return [];
    }

    try {
      console.log('🔄 Fetching MT5 positions...');
      
      const response = await axios.get(`${this.apiUrl}/Positions`, {
        params: { id: this.token },
        timeout: 15000
      });
      
      console.log('✅ MT5 positions response:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('❌ Invalid positions data format:', response.data);
        return [];
      }
      
      return response.data.map((pos: any) => ({
        ticket: pos.Ticket,
        symbol: pos.Symbol,
        type: pos.Type === 'ORDER_TYPE_BUY' ? 'Buy' : 'Sell',
        volume: parseFloat(pos.Volume),
        openPrice: parseFloat(pos.PriceOpen),
        currentPrice: parseFloat(pos.PriceCurrent),
        profit: parseFloat(pos.Profit),
        swap: parseFloat(pos.Swap),
        commission: parseFloat(pos.Commission || '0'),
        openTime: new Date(pos.TimeOpen * 1000).toISOString(),
        comment: pos.Comment || ''
      }));
    } catch (error) {
      console.error('❌ Error fetching MT5 positions:', error);
      
      // Handle authentication errors specifically
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Authentication failed. MT5 session may have expired. Please reconnect.');
      }
      
      return [];
    }
  }

  // Get real-time quote for a symbol
  public async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.token) {
      console.error('❌ No MT5 token available');
      return null;
    }

    try {
      console.log(`🔄 Fetching MT5 quote for ${symbol}...`);
      
      const response = await axios.get(`${this.apiUrl}/GetQuote`, {
        params: { 
          id: this.token,
          symbol: symbol
        },
        timeout: 10000
      });
      
      console.log(`✅ MT5 quote for ${symbol}:`, response.data);
      
      if (!response.data || typeof response.data !== 'object') {
        console.error(`❌ Invalid quote data for ${symbol}:`, response.data);
        return null;
      }
      
      return {
        symbol: symbol,
        bid: parseFloat(response.data.Bid || response.data.bid || '0'),
        ask: parseFloat(response.data.Ask || response.data.ask || '0'),
        time: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error fetching MT5 quote for ${symbol}:`, error);
      
      // Handle authentication errors specifically
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Authentication failed. MT5 session may have expired. Please reconnect.');
      }
      
      return null;
    }
  }

  // Get historical data for a symbol
  public async getHistory(symbol: string, timeframe: string, count: number): Promise<CandlestickData[]> {
    if (!this.token) {
      console.error('❌ No MT5 token available');
      return [];
    }

    try {
      console.log(`🔄 Fetching MT5 history for ${symbol} (${timeframe})...`);
      
      // Convert timeframe to MT5 format
      const mt5Timeframe = this.convertTimeframe(timeframe);
      
      const response = await axios.get(`${this.apiUrl}/GetHistory`, {
        params: { 
          id: this.token,
          symbol: symbol,
          timeframe: mt5Timeframe,
          count: count
        },
        timeout: 20000
      });
      
      console.log(`✅ MT5 history for ${symbol} (${timeframe}):`, response.data);
      
      if (!Array.isArray(response.data)) {
        console.error(`❌ Invalid history data for ${symbol}:`, response.data);
        return [];
      }
      
      return response.data.map((candle: any) => ({
        time: candle.Time * 1000, // Convert to milliseconds
        open: parseFloat(candle.Open),
        high: parseFloat(candle.High),
        low: parseFloat(candle.Low),
        close: parseFloat(candle.Close),
        volume: parseFloat(candle.Volume)
      }));
    } catch (error) {
      console.error(`❌ Error fetching MT5 history for ${symbol}:`, error);
      
      // Handle authentication errors specifically
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Authentication failed. MT5 session may have expired. Please reconnect.');
      }
      
      return [];
    }
  }

  // Get pending orders
  public async getPendingOrders(): Promise<any[]> {
    if (!this.token) {
      console.error('❌ No MT5 token available');
      return [];
    }

    try {
      console.log('🔄 Fetching MT5 pending orders...');
      
      const response = await axios.get(`${this.apiUrl}/OrdersGet`, {
        params: { id: this.token },
        timeout: 15000
      });
      
      console.log('✅ MT5 pending orders response:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('❌ Invalid pending orders data format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching MT5 pending orders:', error);
      
      // Handle authentication errors specifically
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Authentication failed. MT5 session may have expired. Please reconnect.');
      }
      
      return [];
    }
  }

  // Execute a trade
  public async executeTrade(symbol: string, type: 'BUY' | 'SELL', volume: number, price?: number, stopLoss?: number, takeProfit?: number, comment?: string): Promise<{ success: boolean; ticket?: number; message: string }> {
    if (!this.token) {
      console.error('❌ No MT5 token available');
      return { success: false, message: 'Not connected to MT5' };
    }

    try {
      console.log(`🔄 Executing MT5 trade: ${type} ${volume} ${symbol}...`);
      
      const params: any = {
        id: this.token,
        symbol: symbol,
        volume: volume,
        type: type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
        price: price || 0, // 0 means market price
        slippage: 10
      };
      
      if (stopLoss) params.sl = stopLoss;
      if (takeProfit) params.tp = takeProfit;
      if (comment) params.comment = comment;
      
      const response = await axios.get(`${this.apiUrl}/OrderSend`, { 
        params,
        timeout: 15000
      });
      
      console.log('✅ MT5 trade execution response:', response.data);
      
      if (response.data && response.data > 0) {
        return {
          success: true,
          ticket: response.data,
          message: `${type} order executed successfully`
        };
      } else {
        return {
          success: false,
          message: `Failed to execute ${type} order: ${response.data}`
        };
      }
    } catch (error) {
      console.error('❌ Error executing MT5 trade:', error);
      
      // Handle authentication errors specifically
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication failed. MT5 session may have expired. Please reconnect.'
        };
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Close a position
  public async closePosition(ticket: number): Promise<{ success: boolean; message: string }> {
    if (!this.token) {
      console.error('❌ No MT5 token available');
      return { success: false, message: 'Not connected to MT5' };
    }

    try {
      console.log(`🔄 Closing MT5 position ${ticket}...`);
      
      const response = await axios.get(`${this.apiUrl}/OrderClose`, {
        params: { 
          id: this.token,
          ticket: ticket,
          lots: 0, // 0 means close all
          slippage: 10
        },
        timeout: 15000
      });
      
      console.log(`✅ MT5 position close response:`, response.data);
      
      if (response.data === true || response.data === 'true' || response.data === 'True') {
        return {
          success: true,
          message: `Position ${ticket} closed successfully`
        };
      } else {
        return {
          success: false,
          message: `Failed to close position ${ticket}: ${response.data}`
        };
      }
    } catch (error) {
      console.error(`❌ Error closing MT5 position ${ticket}:`, error);
      
      // Handle authentication errors specifically
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication failed. MT5 session may have expired. Please reconnect.'
        };
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper method to convert timeframe to MT5 format
  private convertTimeframe(timeframe: string): string {
    switch (timeframe) {
      case '1M': return 'PERIOD_M1';
      case '5M': return 'PERIOD_M5';
      case '15M': return 'PERIOD_M15';
      case '30M': return 'PERIOD_M30';
      case '1H': return 'PERIOD_H1';
      case '4H': return 'PERIOD_H4';
      case '1D': return 'PERIOD_D1';
      case '1W': return 'PERIOD_W1';
      case '1MN': return 'PERIOD_MN1';
      default: return 'PERIOD_H1';
    }
  }
}

// Create and export a singleton instance
const mt5ApiService = new MT5ApiService();
export default mt5ApiService;