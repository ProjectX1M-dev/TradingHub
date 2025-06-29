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

      // Use GET request with URL parameters instead of POST
      const params = new URLSearchParams({
        accountNumber: credentials.accountNumber,
        password: credentials.password,
        serverName: credentials.serverName,
        apiKey: MT5_API_KEY
      });

      console.log('🔗 Making request to:', `${MT5_API_URL}/ConnectEx`);
      console.log('📋 Request parameters:', {
        accountNumber: credentials.accountNumber,
        serverName: credentials.serverName,
        hasPassword: !!credentials.password,
        hasApiKey: !!MT5_API_KEY
      });

      const response = await axios.get(`${MT5_API_URL}/ConnectEx?${params.toString()}`, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MT5-Trading-App/1.0'
        }
      });

      console.log('✅ MT5 API connection response:', {
        status: response.status,
        statusText: response.statusText,
        hasToken: !!response.data?.token,
        responseData: response.data
      });

      // Store the token for future requests
      if (response.data?.token) {
        mt5Token = response.data.token;
      }

      return {
        success: true,
        token: response.data?.token || null,
        message: response.data?.message || 'Connected successfully'
      };
    } catch (error) {
      console.error('❌ MT5 API connection error:', error);
      
      let errorMessage = 'Failed to connect to MT5 API';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          const statusText = error.response.statusText;
          const responseData = error.response.data;
          
          console.error('❌ MT5 API error details:', {
            status,
            statusText,
            data: responseData,
            headers: error.response.headers
          });
          
          // Provide more specific error messages based on status code
          switch (status) {
            case 401:
              errorMessage = 'Authentication failed. Please check your MT5 API key configuration or verify your account credentials.';
              break;
            case 403:
              errorMessage = 'Access forbidden. Your MT5 API key may not have the required permissions.';
              break;
            case 404:
              errorMessage = 'MT5 API endpoint not found. Please check the API URL configuration.';
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
              } else {
                errorMessage = `MT5 API error: ${status} - ${statusText}`;
              }
          }
        } else if (error.request) {
          console.error('❌ No response received from MT5 API:', error.request);
          errorMessage = 'No response from MT5 API. Please check your internet connection and API URL.';
        } else {
          console.error('❌ Error setting up MT5 API request:', error.message);
          errorMessage = `Request setup error: ${error.message}`;
        }
      } else if (error instanceof Error) {
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
      
      // Prepare the request data
      const requestData: any = {
        id: mt5Token,
        symbol: order.symbol,
        operation,
        volume: order.volume,
        slippage: 10
      };
      
      // Add optional parameters if provided
      if (order.price) requestData.price = order.price;
      if (order.sl) requestData.stoploss = order.sl;
      if (order.tp) requestData.takeprofit = order.tp;

      console.log('🔄 Sending order to MT5 API:', requestData);
      
      const response = await axios.post(`${MT5_API_URL}/OrderSend`, requestData, {
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

      // Prepare the request data
      const requestData: any = {
        id: mt5Token,
        ticket
      };
      
      // Add volume if provided
      if (volume) {
        requestData.lots = volume;
      }

      console.log('🔄 Sending close position request to MT5 API:', requestData);
      
      const response = await axios.post(`${MT5_API_URL}/OrderClose`, requestData, {
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