import axios from 'axios';
import { ConnectionResponse, Position } from '../types/mt5';

// Define the MT5 API URL from environment variables
const MT5_API_URL = import.meta.env.VITE_MT5_API_URL || 'https://mt5full2.mtapi.io';
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
          message: 'MT5 API key is not configured. Please check your environment variables.'
        };
      }

      // Check if API URL is provided
      if (!MT5_API_URL) {
        console.error('❌ MT5 API URL is missing from environment variables');
        return {
          success: false,
          token: null,
          message: 'MT5 API URL is not configured. Please check your environment variables.'
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

      // Try different authentication methods based on common MT5 API patterns
      const authMethods = [
        // Method 1: API key as query parameter
        {
          name: 'Query Parameter Auth',
          params: {
            accountNumber: credentials.accountNumber,
            password: credentials.password,
            serverName: credentials.serverName,
            apiKey: MT5_API_KEY
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MT5-Trading-App/1.0',
            'Accept': 'application/json'
          }
        },
        // Method 2: API key in Authorization header
        {
          name: 'Authorization Header Auth',
          params: {
            accountNumber: credentials.accountNumber,
            password: credentials.password,
            serverName: credentials.serverName
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MT5-Trading-App/1.0',
            'Accept': 'application/json',
            'Authorization': `Bearer ${MT5_API_KEY}`
          }
        },
        // Method 3: API key in X-API-Key header
        {
          name: 'X-API-Key Header Auth',
          params: {
            accountNumber: credentials.accountNumber,
            password: credentials.password,
            serverName: credentials.serverName
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MT5-Trading-App/1.0',
            'Accept': 'application/json',
            'X-API-Key': MT5_API_KEY
          }
        },
        // Method 4: Simple parameter-only approach
        {
          name: 'Simple Parameter Auth',
          params: {
            login: credentials.accountNumber,
            password: credentials.password,
            server: credentials.serverName,
            key: MT5_API_KEY
          },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      ];

      let lastError = null;

      // Try each authentication method
      for (const method of authMethods) {
        try {
          console.log(`🔄 Trying ${method.name}...`);
          
          const params = new URLSearchParams(method.params);
          const url = `${MT5_API_URL}/ConnectEx?${params.toString()}`;
          
          console.log('🔗 Making GET request to:', url.replace(credentials.password, '***'));

          const response = await axios.get(url, {
            timeout: 30000, // 30 second timeout
            headers: method.headers,
            validateStatus: (status) => status < 500 // Don't throw on 4xx errors, we want to handle them
          });

          console.log(`✅ ${method.name} response:`, {
            status: response.status,
            statusText: response.statusText,
            hasToken: !!response.data?.token,
            responseData: response.data
          });

          // If we get a successful response (2xx), process it
          if (response.status >= 200 && response.status < 300) {
            let token = null;
            let message = 'Connected successfully';
            let success = false;

            if (response.data) {
              // Check if response contains token directly
              if (response.data.token) {
                token = response.data.token;
                success = true;
              }
              // Check if response is a string token
              else if (typeof response.data === 'string' && response.data.length > 10) {
                token = response.data;
                success = true;
              }
              // Check if response has success flag
              else if (response.data.success !== undefined) {
                success = response.data.success;
                token = response.data.token || null;
                message = response.data.message || message;
              }
              // Check for error in response
              else if (response.data.error) {
                success = false;
                message = response.data.error;
              }
              // If we get a 200 response but no clear success indicator, assume success
              else {
                success = true;
                // Try to extract any string that looks like a token
                const responseStr = JSON.stringify(response.data);
                const tokenMatch = responseStr.match(/[a-zA-Z0-9]{20,}/);
                if (tokenMatch) {
                  token = tokenMatch[0];
                }
              }

              // Update message if provided in response
              if (response.data.message) {
                message = response.data.message;
              }
            }

            // If this method was successful, store the token and return
            if (success && token) {
              mt5Token = token;
              console.log(`✅ ${method.name} successful! MT5 token stored.`);
              return {
                success: true,
                token,
                message
              };
            }
          }

          // If we get here, this method didn't work, but we'll try the next one
          console.log(`⚠️ ${method.name} didn't work, trying next method...`);
          
        } catch (methodError) {
          console.log(`❌ ${method.name} failed:`, methodError.message);
          lastError = methodError;
          // Continue to next method
        }
      }

      // If we get here, all methods failed
      console.error('❌ All authentication methods failed');
      
      let errorMessage = 'Failed to connect to MT5 API with any authentication method';
      
      if (lastError && axios.isAxiosError(lastError)) {
        if (lastError.response) {
          const status = lastError.response.status;
          const statusText = lastError.response.statusText;
          const responseData = lastError.response.data;
          
          console.error('❌ Last MT5 API error details:', {
            status,
            statusText,
            data: responseData,
            headers: lastError.response.headers
          });
          
          // Provide more specific error messages based on status code
          switch (status) {
            case 400:
              errorMessage = 'Invalid request format. Please check your account credentials and try again.';
              break;
            case 401:
              errorMessage = 'Authentication failed. Please verify your MT5 API key and account credentials. The API key may be invalid or expired.';
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
              if (responseData && typeof responseData === 'string') {
                errorMessage = `MT5 API error: ${responseData}`;
              } else if (responseData && responseData.error) {
                errorMessage = `MT5 API error: ${responseData.error}`;
              } else if (responseData && responseData.message) {
                errorMessage = `MT5 API error: ${responseData.message}`;
              } else {
                errorMessage = `MT5 API error: ${status} - ${statusText}`;
              }
          }
        } else if (lastError.request) {
          console.error('❌ No response received from MT5 API:', lastError.request);
          errorMessage = 'No response from MT5 API. Please check your internet connection and API URL configuration.';
        } else {
          console.error('❌ Error setting up MT5 API request:', lastError.message);
          errorMessage = `Request setup error: ${lastError.message}`;
        }
      } else if (lastError instanceof Error) {
        errorMessage = lastError.message;
      }
      
      return {
        success: false,
        token: null,
        message: errorMessage
      };
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
          'User-Agent': 'MT5-Trading-App/1.0',
          'X-API-Key': MT5_API_KEY,
          'Authorization': `Bearer ${MT5_API_KEY}`
        }
      });
      
      // Get account details
      const detailsResponse = await axios.get(`${MT5_API_URL}/AccountDetails?id=${mt5Token}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0',
          'X-API-Key': MT5_API_KEY,
          'Authorization': `Bearer ${MT5_API_KEY}`
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
          'User-Agent': 'MT5-Trading-App/1.0',
          'X-API-Key': MT5_API_KEY,
          'Authorization': `Bearer ${MT5_API_KEY}`
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
          'User-Agent': 'MT5-Trading-App/1.0',
          'X-API-Key': MT5_API_KEY,
          'Authorization': `Bearer ${MT5_API_KEY}`
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
          'User-Agent': 'MT5-Trading-App/1.0',
          'X-API-Key': MT5_API_KEY,
          'Authorization': `Bearer ${MT5_API_KEY}`
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
          'User-Agent': 'MT5-Trading-App/1.0',
          'X-API-Key': MT5_API_KEY,
          'Authorization': `Bearer ${MT5_API_KEY}`
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
          'User-Agent': 'MT5-Trading-App/1.0',
          'X-API-Key': MT5_API_KEY,
          'Authorization': `Bearer ${MT5_API_KEY}`
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