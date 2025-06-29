import axios from 'axios';
import { ConnectionResponse, Position } from '../types/mt5';

// Define the MT5 API URL from environment variables
const MT5_API_URL = import.meta.env.VITE_MT5_API_URL || 'https://mt5.mtapi.io';
const MT5_API_KEY = import.meta.env.VITE_MT5_API_KEY || '';

// Store the MT5 token for reuse
let mt5Token: string | null = null;

// MT5 API service
const mt5ApiService = {
  // Connect to MT5 API
  connect: async (credentials: { accountNumber: string; password: string; serverName: string }): Promise<ConnectionResponse> => {
    try {
      console.log('🔄 Connecting to MT5 API with credentials:', {
        accountNumber: credentials.accountNumber,
        serverName: credentials.serverName,
        apiUrl: MT5_API_URL,
        hasApiKey: !!MT5_API_KEY,
        apiKeyLength: MT5_API_KEY ? MT5_API_KEY.length : 0,
        // Don't log password for security
        passwordProvided: !!credentials.password
      });

      // Check if API key is provided
      if (!MT5_API_KEY) {
        console.error('❌ MT5 API key is missing from environment variables');
        return {
          success: false,
          token: null,
          message: 'MT5 API key is not configured. Please check your environment variables and ensure VITE_MT5_API_KEY is set.'
        };
      }

      // Check if API URL is provided
      if (!MT5_API_URL) {
        console.error('❌ MT5 API URL is missing from environment variables');
        return {
          success: false,
          token: null,
          message: 'MT5 API URL is not configured. Please check your environment variables and ensure VITE_MT5_API_URL is set.'
        };
      }

      // Validate credentials
      if (!credentials.accountNumber || !credentials.password || !credentials.serverName) {
        return {
          success: false,
          token: null,
          message: 'Missing required credentials. Please provide account number, password, and server name.'
        };
      }

      // Use the correct MT5 API endpoint format based on mt5.mtapi.io documentation
      try {
        console.log('🔄 Attempting MT5 API connection...');
        
        // Build the connection URL with proper parameters
        const connectionParams = new URLSearchParams({
          user: credentials.accountNumber,
          password: credentials.password,
          host: credentials.serverName,
          key: MT5_API_KEY
        });
        
        const connectionUrl = `${MT5_API_URL}/Connect?${connectionParams.toString()}`;
        
        console.log('🔗 Making connection request to MT5 API...');

        const response = await axios.get(connectionUrl, {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MT5-Trading-App/1.0',
            'Accept': 'application/json'
          },
          validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        });

        console.log('✅ MT5 API response received:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });

        // Handle successful response
        if (response.status >= 200 && response.status < 300) {
          let token = null;
          let message = 'Connected successfully';
          let success = false;

          // Check different response formats
          if (typeof response.data === 'string') {
            // Response is a token string
            if (response.data.length > 10 && !response.data.toLowerCase().includes('error')) {
              token = response.data;
              success = true;
            } else {
              message = response.data;
            }
          } else if (response.data && typeof response.data === 'object') {
            // Response is an object
            if (response.data.token) {
              token = response.data.token;
              success = true;
            } else if (response.data.id) {
              token = response.data.id;
              success = true;
            } else if (response.data.success !== undefined) {
              success = response.data.success;
              token = response.data.token || response.data.id || null;
              message = response.data.message || message;
            } else if (response.data.error) {
              success = false;
              message = response.data.error;
            }
          }

          if (success && token) {
            mt5Token = token;
            console.log('✅ MT5 connection successful! Token stored.');
            return {
              success: true,
              token,
              message
            };
          } else {
            console.log('❌ MT5 connection failed:', message);
            return {
              success: false,
              token: null,
              message: message || 'Connection failed - no token received'
            };
          }
        } else {
          // Handle error status codes
          let errorMessage = 'Connection failed';
          
          if (response.data) {
            if (typeof response.data === 'string') {
              errorMessage = response.data;
            } else if (response.data.error) {
              errorMessage = response.data.error;
            } else if (response.data.message) {
              errorMessage = response.data.message;
            }
          }
          
          console.log('❌ MT5 API returned error status:', response.status, errorMessage);
          
          return {
            success: false,
            token: null,
            message: errorMessage
          };
        }
        
      } catch (apiError) {
        console.error('❌ MT5 API connection error:', apiError);
        
        let errorMessage = 'Failed to connect to MT5 API';
        
        if (axios.isAxiosError(apiError)) {
          if (apiError.response) {
            const status = apiError.response.status;
            const responseData = apiError.response.data;
            
            console.error('❌ MT5 API error details:', {
              status,
              statusText: apiError.response.statusText,
              data: responseData
            });
            
            // Provide specific error messages based on status code
            switch (status) {
              case 400:
                errorMessage = 'Invalid request. Please check your account credentials and try again.';
                break;
              case 401:
                errorMessage = 'Authentication failed. Please verify your MT5 API key and account credentials.';
                break;
              case 403:
                errorMessage = 'Access forbidden. Your MT5 API key may not have the required permissions.';
                break;
              case 404:
                errorMessage = 'MT5 API endpoint not found. Please check the API URL configuration.';
                break;
              case 422:
                errorMessage = 'Invalid account credentials. Please check your account number, password, and server name.';
                break;
              case 429:
                errorMessage = 'Too many requests. Please wait a moment and try again.';
                break;
              case 500:
                errorMessage = 'MT5 API server error. Please try again later.';
                break;
              case 503:
                errorMessage = 'MT5 API service unavailable. Please try again later.';
                break;
              default:
                if (responseData) {
                  if (typeof responseData === 'string') {
                    errorMessage = responseData;
                  } else if (responseData.error) {
                    errorMessage = responseData.error;
                  } else if (responseData.message) {
                    errorMessage = responseData.message;
                  }
                }
            }
          } else if (apiError.request) {
            console.error('❌ No response received from MT5 API');
            errorMessage = 'No response from MT5 API. Please check your internet connection and API configuration.';
          } else {
            console.error('❌ Error setting up MT5 API request:', apiError.message);
            errorMessage = `Request setup error: ${apiError.message}`;
          }
        } else if (apiError instanceof Error) {
          errorMessage = apiError.message;
        }
        
        return {
          success: false,
          token: null,
          message: errorMessage
        };
      }
    } catch (error) {
      console.error('❌ Unexpected error in MT5 API connect:', error);
      
      let errorMessage = 'Unexpected error occurred while connecting to MT5 API';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        token: null,
        message: errorMessage
      };
    }
  },

  // Disconnect from MT5 API
  disconnect: () => {
    mt5Token = null;
    console.log('✅ Disconnected from MT5 API');
  },

  // Get the stored token
  getStoredToken: () => {
    return mt5Token;
  },

  // Get account information
  getAccountInfo: async () => {
    try {
      if (!mt5Token) {
        throw new Error('Not connected to MT5 API');
      }

      // Get account summary
      const summaryResponse = await axios.get(`${MT5_API_URL}/AccountSummary?id=${mt5Token}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });
      
      // Get account details
      const detailsResponse = await axios.get(`${MT5_API_URL}/AccountDetails?id=${mt5Token}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });

      // Combine the data
      const accountInfo = {
        balance: summaryResponse.data.balance,
        equity: summaryResponse.data.equity,
        margin: summaryResponse.data.margin,
        freeMargin: summaryResponse.data.freeMargin,
        marginLevel: summaryResponse.data.marginLevel,
        profit: summaryResponse.data.profit,
        currency: detailsResponse.data.currency,
        accountNumber: detailsResponse.data.login,
        accountName: detailsResponse.data.name,
        serverName: detailsResponse.data.server,
        leverage: detailsResponse.data.leverage,
        credit: detailsResponse.data.credit
      };

      return accountInfo;
    } catch (error) {
      console.error('❌ MT5 API getAccountInfo error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ MT5 API error details:', error.response.data);
        
        // Check for authentication errors
        if (error.response.status === 401 || 
            (error.response.data && 
             typeof error.response.data === 'string' && 
             (error.response.data.includes('Authentication failed') || 
              error.response.data.includes('Session expired')))) {
          throw new Error('Authentication failed. Please reconnect your MT5 account.');
        }
      }
      
      throw error;
    }
  },

  // Get open positions
  getPositions: async (): Promise<Position[]> => {
    try {
      if (!mt5Token) {
        throw new Error('Not connected to MT5 API');
      }

      const response = await axios.get(`${MT5_API_URL}/Positions?id=${mt5Token}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });
      
      // Transform the response data to match our Position interface
      const positions: Position[] = response.data.map((pos: any) => ({
        ticket: pos.ticket,
        symbol: pos.symbol,
        type: pos.type === 0 ? 'Buy' : 'Sell',
        volume: pos.volume,
        rawVolume: pos.volume, // Store raw volume for API operations
        openPrice: pos.openPrice,
        currentPrice: pos.currentPrice,
        profit: pos.profit,
        swap: pos.swap,
        commission: pos.commission || 0,
        openTime: pos.openTime,
        comment: pos.comment || ''
      }));

      return positions;
    } catch (error) {
      console.error('❌ MT5 API getPositions error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ MT5 API error details:', error.response.data);
        
        // Check for authentication errors
        if (error.response.status === 401 || 
            (error.response.data && 
             typeof error.response.data === 'string' && 
             (error.response.data.includes('Authentication failed') || 
              error.response.data.includes('Session expired')))) {
          throw new Error('Authentication failed. Please reconnect your MT5 account.');
        }
      }
      
      throw error;
    }
  },

  // Get available symbols
  getSymbols: async (): Promise<string[]> => {
    try {
      if (!mt5Token) {
        throw new Error('Not connected to MT5 API');
      }

      const response = await axios.get(`${MT5_API_URL}/SymbolList?id=${mt5Token}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });
      
      // Ensure we have an array of strings
      let symbols: string[] = [];
      
      if (Array.isArray(response.data)) {
        symbols = response.data.filter(symbol => typeof symbol === 'string');
      } else if (typeof response.data === 'string') {
        // Some APIs return a comma-separated string
        symbols = response.data.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }

      return symbols;
    } catch (error) {
      console.error('❌ MT5 API getSymbols error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ MT5 API error details:', error.response.data);
      }
      
      throw error;
    }
  },

  // Get quote for a symbol
  getQuote: async (symbol: string) => {
    try {
      if (!mt5Token) {
        throw new Error('Not connected to MT5 API');
      }

      const response = await axios.get(`${MT5_API_URL}/GetQuote?id=${mt5Token}&symbol=${symbol}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });
      
      return {
        bid: response.data.bid,
        ask: response.data.ask,
        time: response.data.time || new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ MT5 API getQuote error for ${symbol}:`, error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ MT5 API error details:', error.response.data);
      }
      
      return null;
    }
  },

  // Send an order
  sendOrder: async (order: { 
    symbol: string; 
    action: 'BUY' | 'SELL'; 
    volume: number;
    price?: number;
    sl?: number;
    tp?: number;
  }) => {
    try {
      if (!mt5Token) {
        throw new Error('Not connected to MT5 API');
      }

      // Convert action to MT5 API format
      const operation = order.action === 'BUY' ? 'Buy' : 'Sell';
      
      // Prepare the request parameters
      const params = new URLSearchParams({
        id: mt5Token,
        symbol: order.symbol,
        operation: operation,
        volume: order.volume.toString(),
        slippage: '10'
      });
      
      // Add optional parameters if provided
      if (order.price) params.append('price', order.price.toString());
      if (order.sl) params.append('stoploss', order.sl.toString());
      if (order.tp) params.append('takeprofit', order.tp.toString());

      console.log('🔄 Sending order to MT5 API:', Object.fromEntries(params));
      
      const response = await axios.get(`${MT5_API_URL}/OrderSend?${params.toString()}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });
      
      console.log('✅ MT5 API order response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ MT5 API sendOrder error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ MT5 API error details:', error.response.data);
        
        return {
          retcode: 10004, // Error code
          comment: error.response.data
        };
      }
      
      return {
        retcode: 10004, // Error code
        comment: error.message || 'Unknown error'
      };
    }
  },

  // Close a position
  closePosition: async (ticket: number, volume?: number): Promise<{ 
    success: boolean; 
    message: string; 
    retcode: number; 
    profit?: number; 
    formatDescription?: string;
  }> => {
    try {
      if (!mt5Token) {
        throw new Error('Not connected to MT5 API');
      }

      console.log(`🔄 Closing position ${ticket} with volume ${volume || 'auto'}`);
      
      // First, try to get the position details to capture the profit before closing
      let positionProfit = 0;
      try {
        const positions = await mt5ApiService.getPositions();
        const position = positions.find(p => p.ticket === ticket);
        if (position) {
          positionProfit = position.profit;
          console.log(`📊 Found position ${ticket} with profit ${positionProfit} before closing`);
        } else {
          console.log(`⚠️ Position ${ticket} not found in open positions, may already be closed`);
        }
      } catch (posError) {
        console.warn(`⚠️ Could not get position details before closing: ${posError.message}`);
      }

      // Prepare the request parameters
      const params = new URLSearchParams({
        id: mt5Token,
        ticket: ticket.toString()
      });
      
      // Add volume if provided
      if (volume) {
        params.append('lots', volume.toString());
      }

      console.log('🔄 Sending close position request to MT5 API:', Object.fromEntries(params));
      
      const response = await axios.get(`${MT5_API_URL}/OrderClose?${params.toString()}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });
      
      console.log('✅ MT5 API close position response:', response.data);
      
      // Check if the response contains profit information
      let responseProfit = 0;
      if (response.data && typeof response.data === 'object') {
        if (response.data.profit !== undefined) {
          responseProfit = response.data.profit;
          console.log(`📊 Response contains profit information: ${responseProfit}`);
        }
      }
      
      // Use the response profit if available, otherwise use the position profit we captured earlier
      const finalProfit = responseProfit !== 0 ? responseProfit : positionProfit;
      
      return {
        success: true,
        message: `Position ${ticket} closed successfully`,
        retcode: 10009, // Success code
        profit: finalProfit,
        formatDescription: volume ? 'with specified volume' : 'with auto volume'
      };
    } catch (error) {
      console.error(`❌ MT5 API closePosition error for ticket ${ticket}:`, error);
      
      // Check if it's a "position not found" error, which can happen if the position was already closed
      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ MT5 API error details:', error.response.data);
        
        const errorMessage = error.response.data;
        if (typeof errorMessage === 'string' && 
            (errorMessage.includes('position not found') || 
             errorMessage.includes('already closed') ||
             errorMessage.includes('POSITION_NOT_EXISTS'))) {
          return {
            success: true,
            message: `Position ${ticket} was already closed`,
            retcode: 10009, // Success code
            profit: 0 // We don't know the profit if it was already closed
          };
        }
        
        return {
          success: false,
          message: errorMessage,
          retcode: 10004, // Error code
          profit: 0
        };
      }
      
      return {
        success: false,
        message: error.message || 'Unknown error',
        retcode: 10004, // Error code
        profit: 0
      };
    }
  }
};

export default mt5ApiService;