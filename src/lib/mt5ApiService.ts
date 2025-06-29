import axios, { AxiosInstance } from 'axios';
import {
  AccountInfo,
  Position
} from '../types/mt5';

interface ConnectionCredentials {
  accountNumber: string;
  password: string;
  serverName: string;
}

interface ConnectionResponse {
  success: boolean;
  token?: string;
  message: string;
}

interface VolumeFormatEntry {
  value: number;
  description: string;
}

class MT5ApiService {
  private apiClient: AxiosInstance;
  private token: string | null = null;
  private baseURL: string;
  private apiKey: string;

  constructor() {
    // Use environment variable for MT5 API URL, fallback to default
    this.baseURL = import.meta.env.VITE_MT5_API_URL || 'https://mt5full2.mtapi.io';
    this.apiKey = import.meta.env.VITE_MT5_API_KEY || '';
    
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': this.apiKey
      },
    });

   

    // Try to restore token from localStorage on initialization
    const storedToken = this.getStoredToken();
    if (storedToken) {
      this.token = storedToken;
      console.log('🔑 Restored MT5 token from localStorage');
    }
  }

  // Set API endpoint dynamically
  setApiEndpoint(endpoint: string) {
    this.baseURL = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    this.apiClient.defaults.baseURL = this.baseURL;
  }

  // Enhanced connection method with improved response parsing
  async connect(credentials: ConnectionCredentials): Promise<ConnectionResponse> {
    try {
      console.log('🔄 Connecting to MT5 API with credentials:', {
        user: credentials.accountNumber,
        server: credentials.serverName,
        apiKeyProvided: !!this.apiKey
        // Password is omitted for security
      });
      
      // Log the connection URL (without password)
      console.log(`🔄 Connection URL: ${this.baseURL}/Connect?user=${credentials.accountNumber}&server=${encodeURIComponent(credentials.serverName)}`);
      
      // Use ConnectEx endpoint from the API spec
      const response = await this.apiClient.get('/ConnectEx', {
        params: {
          user: parseInt(credentials.accountNumber),
          password: credentials.password,
          server: credentials.serverName
        }
      });
      
      console.log('📥 MT5 API connection response:', {
        status: response.status,
        dataType: typeof response.data,
        data: typeof response.data === 'string' ? response.data.substring(0, 20) + '...' : response.data
      });
      
      // Enhanced response parsing logic
      if (response.status === 200 || response.status === 201) {
        const responseData = response.data;
        
        // Case 1: Response is an object
        if (typeof responseData === 'object' && responseData !== null) {
          // First check if it contains a valid token field (success case)
          if ('token' in responseData && typeof responseData.token === 'string' && 
              responseData.token.length > 10 && !responseData.token.includes('INVALID') && 
              !responseData.token.includes('ERROR')) {
            this.token = responseData.token;
            if (this.token) {
              localStorage.setItem('mt5_token', this.token);
            }
            console.log('🔑 MT5 token stored from object response');
            return {
              success: true,
              token: this.token || undefined,
              message: responseData.message || 'Connected successfully'
            };
          }
          
          // Check for direct error indicators in object
          if ('error' in responseData || 'code' in responseData || 
              ('message' in responseData && typeof responseData.message === 'string')) {
            const errorMessage = responseData.error || responseData.message || 'Unknown error';
            const errorCode = responseData.code || 'UNKNOWN_ERROR';
            
            console.error('❌ MT5 API returned an error object:', {
              message: errorMessage,
              code: errorCode,
              fullResponse: responseData
            });
            
            // Provide more specific error messages for common issues
            let userFriendlyMessage = errorMessage;
            if (errorCode === 'INVALID_ACCOUNT' || errorMessage.includes('INVALID_ACCOUNT')) {
              userFriendlyMessage = 'Invalid account credentials. Please verify your account number, password, and server are correct.';
            } else if (errorCode === 'INVALID_PASSWORD' || errorMessage.includes('INVALID_PASSWORD')) {
              userFriendlyMessage = 'Incorrect password. Please check your MT5 account password.';
            } else if (errorCode === 'INVALID_SERVER' || errorMessage.includes('INVALID_SERVER')) {
              userFriendlyMessage = 'Invalid server. Please select the correct server for your broker.';
            } else if (errorCode === 'ACCOUNT_DISABLED' || errorMessage.includes('ACCOUNT_DISABLED')) {
              userFriendlyMessage = 'Account is disabled. Please contact your broker to activate your account.';
            } else if (errorCode === 'CONNECTION_FAILED' || errorMessage.includes('CONNECTION_FAILED')) {
              userFriendlyMessage = 'Failed to connect to broker server. Please check your internet connection and try again.';
            }
            
            return {
              success: false,
              message: userFriendlyMessage
            };
          }
          
          // Check if object contains other success indicators
          if ('success' in responseData && responseData.success === true) {
            // Look for token in other possible fields
            const possibleTokenFields = ['id', 'sessionId', 'connectionId', 'accessToken'];
            for (const field of possibleTokenFields) {
              if (field in responseData && typeof responseData[field] === 'string' && 
                  responseData[field].length > 10) {
                this.token = responseData[field];
                if (this.token) {
                  localStorage.setItem('mt5_token', this.token);
                }
                console.log(`🔑 MT5 token stored from ${field} field`);
                return {
                  success: true,
                  token: this.token || undefined,
                  message: responseData.message || 'Connected successfully'
                };
              }
            }
          }
        }
        
        // Case 2: Response is a string
        if (typeof responseData === 'string') {
          // Check if it's an error message
          const lowerResponse = responseData.toLowerCase();
          if (lowerResponse.includes('invalid') || lowerResponse.includes('error') || 
              lowerResponse.includes('failed') || lowerResponse.includes('denied')) {
            console.error('❌ MT5 API returned an error string:', responseData);
            
            // Provide user-friendly error messages
            let userFriendlyMessage = responseData;
            if (lowerResponse.includes('invalid_account') || lowerResponse.includes('invalid account')) {
              userFriendlyMessage = 'Invalid account credentials. Please verify your account number, password, and server are correct.';
            } else if (lowerResponse.includes('invalid_password') || lowerResponse.includes('invalid password')) {
              userFriendlyMessage = 'Incorrect password. Please check your MT5 account password.';
            } else if (lowerResponse.includes('invalid_server') || lowerResponse.includes('invalid server')) {
              userFriendlyMessage = 'Invalid server. Please select the correct server for your broker.';
            }
            
            return {
              success: false,
              message: userFriendlyMessage
            };
          }
          
          // Check if it's a valid token
          if (responseData.length > 10 && !lowerResponse.includes('invalid') && 
              !lowerResponse.includes('error')) {
            this.token = responseData;
            if (this.token) {
              localStorage.setItem('mt5_token', this.token);
            }
            console.log('🔑 MT5 token stored from string response');
            return {
              success: true,
              token: this.token || undefined,
              message: 'Connected successfully'
            };
          }
        }
        
        // Case 3: Response is a number (could be a token ID)
        if (typeof responseData === 'number' && responseData > 0) {
          this.token = responseData.toString();
          localStorage.setItem('mt5_token', this.token);
          console.log('🔑 MT5 token stored from numeric response');
          return {
            success: true,
            token: this.token || undefined,
            message: 'Connected successfully'
          };
        }
        
        // If we reach here, the response format is unexpected but status is 200/201
        console.warn('⚠️ Unexpected response format but HTTP status indicates success:', responseData);
        return {
          success: false,
          message: 'Unexpected response format from MT5 API. Please try again.'
        };
      } else {
        return {
          success: false,
          message: `Connection failed with HTTP status: ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      
      // Provide user-friendly error messages for common network issues
      let userFriendlyMessage = error.message || 'Connection failed';
      if (error.code === 'ECONNREFUSED') {
        userFriendlyMessage = 'Cannot connect to MT5 API server. Please check your internet connection and try again.';
      } else if (error.code === 'ETIMEDOUT') {
        userFriendlyMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.response?.status === 404) {
        userFriendlyMessage = 'MT5 API endpoint not found. Please contact support.';
      }
      
      return {
        success: false,
        message: userFriendlyMessage
      };
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      if (this.token) {
        await this.apiClient.get('/Disconnect', {
          params: { id: this.token }
        });
      }
      this.token = null;
      localStorage.removeItem('mt5_token');
      console.log('🔑 MT5 token cleared from localStorage and memory');
      
      // Recreate the API client to ensure fresh state
      this.apiClient = axios.create({
        baseURL: this.baseURL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'ApiKey': this.apiKey
        },
      });
      return true;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      if (!this.token) return false;
      const response = await this.apiClient.get('/CheckConnect', {
        params: { id: this.token }
      });
      return response.status === 200 || response.status === 201;
    } catch (error) {
      return false;
    }
  }

  // Enhanced getAccountInfo method with proper error handling
  async getAccountInfo(): Promise<AccountInfo | null> {
    try {
      if (!this.token) {
        console.warn('⚠️ Not connected to MT5 (no token) when trying to get account info');
        return null;
      }

      console.log('🔄 Fetching account info from MT5 API...');

      // Make concurrent calls to both AccountSummary and AccountDetails
      const [summaryResponse, detailsResponse] = await Promise.all([
        this.apiClient.get('/AccountSummary', {
          params: { id: this.token }
        }),
        this.apiClient.get('/AccountDetails', {
          params: { id: this.token }
        }).catch(error => {
          // AccountDetails might not be available on all brokers
          console.warn('AccountDetails not available:', error.message);
          return { status: 404, data: null };
        })
      ]);

      console.log('📥 MT5 API AccountSummary response:', {
        status: summaryResponse.status,
        dataType: typeof summaryResponse.data,
        data: summaryResponse.data
      });

      if (detailsResponse.status === 200 || detailsResponse.status === 201) {
        console.log('📥 MT5 API AccountDetails response:', {
          status: detailsResponse.status,
          dataType: typeof detailsResponse.data,
          data: detailsResponse.data
        });
      }

      // Accept both 200 and 201 status codes
      if ((summaryResponse.status === 200 || summaryResponse.status === 201) && summaryResponse.data) {
        const summaryData = summaryResponse.data;
        const detailsData = (detailsResponse.status === 200 || detailsResponse.status === 201) ? detailsResponse.data : {};

        const accountInfo = {
          balance: summaryData.balance || 0,
          equity: summaryData.equity || 0,
          margin: summaryData.margin || 0,
          freeMargin: summaryData.freeMargin || 0,
          marginLevel: summaryData.marginLevel || 0,
          currency: summaryData.currency || 'USD',
          profit: summaryData.profit || 0,
          credit: summaryData.credit || 0,
          // Account details (may be empty if endpoint not available)
          accountNumber: detailsData?.Login?.toString() || '',
          accountName: detailsData?.Name || '',
          serverName: detailsData?.Server || '',
          leverage: detailsData?.Leverage || 1,
        };

        console.log('✅ Processed account info:', accountInfo);
        return accountInfo;
      }
      
      console.log('❌ Failed to get account info - invalid response');
      return null;
    } catch (error: any) {
      console.error('Failed to get account info:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || 
          error.message.includes('Session expired') ||
          error.message.includes('Invalid token') ||
          error.response?.status === 401) {
        
        console.log('🔑 Authentication error detected, clearing token');
        this.clearToken();
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(error.message || 'Failed to retrieve account information');
    }
  }

  // Get available symbols from the broker with proper error handling
  async getSymbols(): Promise<string[]> {
    try {
      if (!this.token) {
        console.warn('⚠️ Not connected to MT5 (no token) when trying to get symbols');
        return [];
      }

      const response = await this.apiClient.get('/SymbolList', {
        params: { id: this.token }
      });
      
      // Accept both 200 and 201 status codes
      if ((response.status === 200 || response.status === 201) && response.data) {
        // The API should return an array of symbol names
        if (Array.isArray(response.data)) {
          return response.data.filter(symbol => typeof symbol === 'string');
        }
        // If it's a single string, split by newlines or commas
        if (typeof response.data === 'string') {
          return response.data
            .split(/[\n,]/)
            .map(symbol => symbol.trim())
            .filter(symbol => symbol.length > 0);
        }
      }
      
      // Return empty array if no symbols found
      return [];
    } catch (error: any) {
      console.error('Failed to get symbols:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || 
          error.message.includes('Session expired') ||
          error.message.includes('Invalid token') ||
          error.response?.status === 401) {
        
        console.log('🔑 Authentication error detected, clearing token');
        this.clearToken();
      }
      
      throw new Error(error.message || 'Failed to retrieve symbols');
    }
  }

  // NEW: Method to subscribe to a symbol
  async subscribeSymbol(symbol: string): Promise<boolean> {
    try {
      if (!this.token) {
        throw new Error('Not authenticated. Please login first.');
      }

      console.log(`🔄 Subscribing to symbol: ${symbol}`);
      
      const response = await this.apiClient.get('/Subscribe', {
        params: { 
          id: this.token,
          symbol: symbol
        }
      });
      
      console.log(`📥 Symbol subscription response for ${symbol}:`, {
        status: response.status,
        data: response.data
      });
      
      // Accept both 200 and 201 status codes as success
      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Successfully subscribed to symbol: ${symbol}`);
        return true;
      }
      
      console.log(`❌ Failed to subscribe to symbol: ${symbol}`);
      return false;
    } catch (error) {
      console.error(`❌ Error subscribing to symbol ${symbol}:`, error);
      return false;
    }
  }

  // NEW: Method to find the best matching symbol from available symbols
  async findMatchingSymbol(baseSymbol: string): Promise<string | null> {
    try {
      if (!this.token) {
        throw new Error('Not authenticated. Please login first.');
      }

      console.log(`🔍 Finding matching symbol for: ${baseSymbol}`);
      
      // Normalize the base symbol (remove any suffix)
      const normalizedSymbol = baseSymbol.replace(/\.(raw|m|c|pro|ecn|stp)$/i, "");
      console.log(`🔍 Normalized symbol: ${normalizedSymbol}`);
      
      // Get all available symbols
      const allSymbols = await this.getSymbols();
      console.log(`🔍 Found ${allSymbols.length} symbols from broker`);
      
      if (allSymbols.length === 0) {
        console.error('❌ No symbols available from broker');
        return null;
      }
      
      // First, check for exact match
      if (allSymbols.includes(baseSymbol)) {
        console.log(`✅ Found exact match for ${baseSymbol}`);
        return baseSymbol;
      }
      
      // Then check for normalized match
      if (allSymbols.includes(normalizedSymbol)) {
        console.log(`✅ Found normalized match for ${normalizedSymbol}`);
        return normalizedSymbol;
      }
      
      // Look for special cases like XAUUSD, GOLD, etc.
      if (normalizedSymbol.includes('XAU') || normalizedSymbol.includes('GOLD')) {
        // Find gold-related symbols
        const goldCandidates = allSymbols.filter(sym => 
          sym.toLowerCase().includes('xau') || 
          sym.toLowerCase().includes('gold')
        );
        
        if (goldCandidates.length > 0) {
          console.log(`✅ Found ${goldCandidates.length} gold-related symbols:`, goldCandidates);
          return goldCandidates[0]; // Return the first match
        }
      }
      
      // Look for other special cases
      if (normalizedSymbol.includes('XAG') || normalizedSymbol.includes('SILVER')) {
        const silverCandidates = allSymbols.filter(sym => 
          sym.toLowerCase().includes('xag') || 
          sym.toLowerCase().includes('silver')
        );
        
        if (silverCandidates.length > 0) {
          console.log(`✅ Found ${silverCandidates.length} silver-related symbols:`, silverCandidates);
          return silverCandidates[0];
        }
      }
      
      // For other symbols, try to find partial matches
      const partialMatches = allSymbols.filter(sym => 
        sym.includes(normalizedSymbol) || 
        normalizedSymbol.includes(sym)
      );
      
      if (partialMatches.length > 0) {
        console.log(`✅ Found ${partialMatches.length} partial matches:`, partialMatches);
        return partialMatches[0];
      }
      
      // If no matches found, log all available symbols for debugging
      console.error(`❌ No matching symbol found for ${baseSymbol}. Available symbols:`, allSymbols.slice(0, 20), '...');
      return null;
    } catch (error) {
      console.error(`❌ Error finding matching symbol for ${baseSymbol}:`, error);
      return null;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      if (!this.token) {
        console.warn('⚠️ Not connected to MT5 (no token) when trying to get positions');
        return [];
      }

      console.log('🔍 Fetching positions from MT5 API...');
      const response = await this.apiClient.get('/OpenedOrders', {
        params: { id: this.token }
      });
      
      console.log('📥 Raw positions response:', {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null
      });
      
      // Accept both 200 and 201 status codes
      if ((response.status === 200 || response.status === 201) && response.data) {
        // Ensure response.data is an array before attempting to filter
        let ordersData = response.data;
        
        // If response.data is not an array, handle different possible formats
        if (!Array.isArray(ordersData)) {
          // If it's null, undefined, or empty, return empty array
          if (!ordersData) {
            return [];
          }
          
          // If it's an object with an array property, try to extract it
          if (typeof ordersData === 'object') {
            // Common patterns: { orders: [...] }, { data: [...] }, { positions: [...] }
            if (Array.isArray(ordersData.orders)) {
              ordersData = ordersData.orders;
            } else if (Array.isArray(ordersData.data)) {
              ordersData = ordersData.data;
            } else if (Array.isArray(ordersData.positions)) {
              ordersData = ordersData.positions;
            } else {
              // If it's a single order object, wrap it in an array
              ordersData = [ordersData];
            }
          } else {
            // If it's a primitive type, return empty array
            return [];
          }
        }
        
        // Now safely filter for market orders (positions)
        const positions = ordersData.filter((order: any) => 
          order && (order.orderType === 'Buy' || order.orderType === 'Sell')
        );
        
        console.log(`📊 Found ${positions.length} market positions`);
        
        return positions.map((position: any, index: number) => {
          // Based on the API schema, use 'lots' field for volume display
          // Store both lots and raw volume for closing operations
          const lots = position.lots || 0;
          const rawVolume = position.volume || 0;
          
          console.log(`📋 Position ${index + 1} details:`, {
            ticket: position.ticket,
            symbol: position.symbol,
            orderType: position.orderType,
            lots: lots,
            volume: rawVolume,
            openPrice: position.openPrice,
            closePrice: position.closePrice,
            profit: position.profit
          });
          
          return {
            ticket: position.ticket || 0,
            symbol: position.symbol || '',
            type: position.orderType as 'Buy' | 'Sell',
            volume: lots, // Display volume in lots
            rawVolume: rawVolume, // Store raw volume for API operations
            openPrice: position.openPrice || 0,
            currentPrice: position.closePrice || position.openPrice || 0,
            profit: position.profit || 0,
            swap: position.swap || 0,
            commission: position.commission || 0,
            openTime: position.openTime || '',
            comment: position.comment || '',
          };
        });
      }
      return [];
    } catch (error: any) {
      console.error('Failed to get positions:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || 
          error.message.includes('Session expired') ||
          error.message.includes('Invalid token') ||
          error.response?.status === 401) {
        
        console.log('🔑 Authentication error detected, clearing token');
        this.clearToken();
      }
      
      throw new Error(error.message || 'Failed to retrieve positions');
    }
  }

  // Helper function to parse MT5 API response and return consistent format
  private parseOrderResponse(responseData: any, operation: string): { retcode: number; order?: number; comment: string; orderData?: any } {
    console.log(`📊 Parsing ${operation} response:`, {
      dataType: typeof responseData,
      data: responseData,
      isNull: responseData === null,
      isUndefined: responseData === undefined
    });

    // Handle null or undefined responses - assume success for some operations
    if (responseData === null || responseData === undefined) {
      console.log(`✅ Null/undefined response for ${operation} - assuming success`);
      return {
        retcode: 10009,
        comment: `${operation} completed successfully`
      };
    }

    // Handle object responses
    if (typeof responseData === 'object') {
      console.log(`📊 Object response properties:`, Object.keys(responseData));
      
      // Check for ticket number (success indicator)
      if ('ticket' in responseData && responseData.ticket > 0) {
        console.log(`✅ Found ticket number: ${responseData.ticket}`);
        return {
          retcode: 10009,
          order: responseData.ticket,
          comment: responseData.message || responseData.comment || `${operation} successful`,
          orderData: responseData
        };
      }
      
      // Check for retcode
      if ('retcode' in responseData) {
        const retcode = parseInt(responseData.retcode) || responseData.retcode;
        console.log(`📊 Found retcode: ${retcode}`);
        
        if (retcode === 10009 || retcode === '10009') {
          return {
            retcode: 10009,
            order: responseData.order || responseData.ticket || 0,
            comment: responseData.comment || responseData.message || `${operation} successful`
          };
        } else {
          return {
            retcode: parseInt(retcode) || 10004,
            comment: responseData.comment || responseData.message || `${operation} failed with retcode: ${retcode}`
          };
        }
      }
      
      // Check for success indicators
      if ('success' in responseData) {
        if (responseData.success === true || responseData.success === 'true') {
          return {
            retcode: 10009,
            order: responseData.order || responseData.ticket || 0,
            comment: responseData.message || responseData.comment || `${operation} successful`
          };
        } else {
          return {
            retcode: 10004,
            comment: responseData.message || responseData.comment || `${operation} failed`
          };
        }
      }
      
      // Check for error indicators
      if ('error' in responseData || 'Error' in responseData) {
        const errorMsg = responseData.error || responseData.Error;
        console.log(`❌ Found error in response: ${errorMsg}`);
        return {
          retcode: 10004,
          comment: errorMsg || `${operation} failed`
        };
      }
      
      // Check message for success/error keywords
      if ('message' in responseData && typeof responseData.message === 'string') {
        const message = responseData.message.toLowerCase();
        if (message.includes('success') || message.includes('executed') || message.includes('placed')) {
          return {
            retcode: 10009,
            order: responseData.order || responseData.ticket || 0,
            comment: responseData.message
          };
        } else if (message.includes('error') || message.includes('failed') || message.includes('invalid')) {
          return {
            retcode: 10004,
            comment: responseData.message
          };
        }
      }
      
      // If object has order/ticket field, assume success
      if ('order' in responseData && responseData.order > 0) {
        return {
          retcode: 10009,
          order: responseData.order,
          comment: responseData.comment || responseData.message || `${operation} successful`
        };
      }
      
      // Default for unrecognized object format - assume success if no clear error
      console.log(`⚠️ Unrecognized object format for ${operation} - assuming success`);
      return {
        retcode: 10009,
        comment: `${operation} completed (unrecognized response format)`
      };
    }

    // Handle string responses
    if (typeof responseData === 'string') {
      console.log(`📝 String response: "${responseData}"`);
      
      // Try to parse as ticket number
      const ticketNumber = parseInt(responseData, 10);
      if (!isNaN(ticketNumber) && ticketNumber > 0) {
        console.log(`✅ Parsed ticket number: ${ticketNumber}`);
        return {
          retcode: 10009,
          order: ticketNumber,
          comment: `${operation} successful`
        };
      }
      
      // Check for success keywords
      const lowerResponse = responseData.toLowerCase();
      if (lowerResponse.includes('success') || lowerResponse.includes('executed') || 
          lowerResponse.includes('placed') || lowerResponse === 'ok' || lowerResponse === 'true') {
        return {
          retcode: 10009,
          comment: responseData
        };
      }
      
      // Check for error keywords
      if (lowerResponse.includes('error') || lowerResponse.includes('failed') || 
          lowerResponse.includes('invalid') || lowerResponse.includes('denied')) {
        return {
          retcode: 10004,
          comment: responseData
        };
      }
      
      // For other strings, assume it's an informational message and success
      return {
        retcode: 10009,
        comment: responseData
      };
    }

    // Handle numeric responses
    if (typeof responseData === 'number') {
      console.log(`📊 Numeric response: ${responseData}`);
      
      if (responseData > 0) {
        // Positive number likely indicates ticket/order ID
        return {
          retcode: 10009,
          order: responseData,
          comment: `${operation} successful`
        };
      } else if (responseData === 0) {
        // Zero might indicate success without ticket
        return {
          retcode: 10009,
          comment: `${operation} completed`
        };
      } else {
        // Negative number likely indicates error
        return {
          retcode: Math.abs(responseData) || 10004,
          comment: `${operation} failed with code: ${responseData}`
        };
      }
    }

    // Handle boolean responses
    if (typeof responseData === 'boolean') {
      console.log(`📊 Boolean response: ${responseData}`);
      return {
        retcode: responseData ? 10009 : 10004,
        comment: responseData ? `${operation} successful` : `${operation} failed`
      };
    }

    // Fallback for completely unexpected formats
    console.warn(`⚠️ Completely unexpected response format for ${operation}:`, responseData);
    return {
      retcode: 10004,
      comment: `${operation} failed - unexpected response format`
    };
  }

  // FIXED: sendOrder method with robust response parsing - UPDATED TO USE GET
  async sendOrder(orderRequest: {
    symbol: string;
    action: 'BUY' | 'SELL';
    volume: number;
    price?: number;
    sl?: number;
    tp?: number;
    comment?: string;
  }): Promise<any> {
    try {
      if (!this.token) {
        console.warn('⚠️ Not connected to MT5 (no token) when trying to send order');
        return { retcode: 10004, comment: 'Not connected to MT5' };
      }

      // First, try to find the correct symbol and subscribe to it
      const originalSymbol = orderRequest.symbol;
      let actualSymbol = originalSymbol;
      
      // Find the best matching symbol from the broker
      const matchingSymbol = await this.findMatchingSymbol(originalSymbol);
      if (matchingSymbol) {
        console.log(`✅ Found matching symbol: ${matchingSymbol} for requested symbol: ${originalSymbol}`);
        actualSymbol = matchingSymbol;
        
        // Subscribe to the symbol before trading
        const subscribed = await this.subscribeSymbol(actualSymbol);
        if (subscribed) {
          console.log(`✅ Successfully subscribed to symbol: ${actualSymbol}`);
        } else {
          console.warn(`⚠️ Failed to subscribe to symbol: ${actualSymbol}, but will attempt to trade anyway`);
        }
      } else {
        console.warn(`⚠️ No matching symbol found for ${originalSymbol}, will attempt with original symbol`);
      }

      const operation = orderRequest.action === 'BUY' ? 'Buy' : 'Sell';
      
      // Build parameters object, only including optional parameters if they have valid values
      const params: any = {
        id: this.token,
        symbol: actualSymbol,
        operation: operation,
        volume: orderRequest.volume,
        slippage: 10,
        expertID: 0
      };

      // Only add optional parameters if they are defined and greater than 0
      if (orderRequest.price && orderRequest.price > 0) {
        params.price = orderRequest.price;
      }
      
      if (orderRequest.sl && orderRequest.sl > 0) {
        params.stoploss = orderRequest.sl;
      }
      
      if (orderRequest.tp && orderRequest.tp > 0) {
        params.takeprofit = orderRequest.tp;
      }
      
      if (orderRequest.comment) {
        params.comment = orderRequest.comment;
      }

      console.log('🔄 Sending order to MT5 API with parameters:', {
        symbol: actualSymbol,
        action: orderRequest.action,
        operation: operation,
        volume: orderRequest.volume,
        price: orderRequest.price,
        sl: orderRequest.sl,
        tp: orderRequest.tp,
        comment: orderRequest.comment,
        token: this.token ? `${this.token.substring(0, 5)}...` : 'null'
      });

      // FIXED: Use GET instead of POST for OrderSend
      const response = await this.apiClient.get('/OrderSend', {
        params: params
      });
      
      console.log('📥 MT5 API OrderSend response:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        data: response.data
      });
      
      if (response.status === 200 || response.status === 201) {
        // Use the robust response parser
        const result = this.parseOrderResponse(response.data, 'OrderSend');
        console.log('📊 Parsed OrderSend result:', result);
        return result;
      }
      
      // Non-200/201 status code
      console.error(`❌ OrderSend failed with HTTP status: ${response.status}`, response.data);
      return {
        retcode: 10004,
        comment: `Order failed with HTTP status: ${response.status}`
      };
      
    } catch (error: any) {
      console.error('❌ OrderSend error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || 
          error.message.includes('Session expired') ||
          error.message.includes('Invalid token') ||
          error.response?.status === 401) {
        
        console.log('🔑 Authentication error detected, clearing token');
        this.clearToken();
      }
      
      // Return consistent error format instead of throwing
      return {
        retcode: 10004,
        comment: error.message || 'Failed to send order'
      };
    }
  }

  // Enhanced method to get current market quote
  async getQuote(symbol: string): Promise<{ bid: number; ask: number; time: string } | null> {
    try {
      if (!this.token) {
        console.warn('⚠️ Not connected to MT5 (no token) when trying to get quote');
        return null;
      }

      // First, try to find the correct symbol and subscribe to it
      let actualSymbol = symbol;
      
      // Find the best matching symbol from the broker
      const matchingSymbol = await this.findMatchingSymbol(symbol);
      if (matchingSymbol) {
        console.log(`✅ [getQuote] Found matching symbol: ${matchingSymbol} for requested symbol: ${symbol}`);
        actualSymbol = matchingSymbol;
        
        // Subscribe to the symbol before getting quote
        const subscribed = await this.subscribeSymbol(actualSymbol);
        if (subscribed) {
          console.log(`✅ [getQuote] Successfully subscribed to symbol: ${actualSymbol}`);
        } else {
          console.warn(`⚠️ [getQuote] Failed to subscribe to symbol: ${actualSymbol}, but will attempt to get quote anyway`);
        }
      } else {
        console.warn(`⚠️ [getQuote] No matching symbol found for ${symbol}, will attempt with original symbol`);
      }

      console.log(`🔍 Getting quote for ${actualSymbol}...`);
      
      const response = await this.apiClient.get('/GetQuote', {
        params: { 
          id: this.token,
          symbol: actualSymbol,
          msNotOlder: 0 // Get latest quote
        }
      });
      
      console.log(`📥 Quote response for ${actualSymbol}:`, {
        status: response.status,
        dataType: typeof response.data,
        data: response.data
      });
      
      if ((response.status === 200 || response.status === 201) && response.data) {
        const quote = response.data;
        if (quote && typeof quote.bid === 'number' && typeof quote.ask === 'number') {
          console.log(`✅ Quote received for ${actualSymbol}: Bid=${quote.bid}, Ask=${quote.ask}`);
          return {
            bid: quote.bid,
            ask: quote.ask,
            time: quote.time || new Date().toISOString()
          };
        } else {
          console.warn(`⚠️ Invalid quote data for ${actualSymbol}:`, quote);
        }
      } else {
        console.warn(`⚠️ Failed to get quote for ${actualSymbol} - invalid response`);
      }
      
      return null;
    } catch (error: any) {
      console.error(`❌ Failed to get quote for ${symbol}:`, error);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || 
          error.message.includes('Session expired') ||
          error.message.includes('Invalid token') ||
          error.response?.status === 401) {
        
        console.log('🔑 Authentication error detected, clearing token');
        this.clearToken();
      }
      
      throw new Error(error.message || 'Failed to retrieve quote');
    }
  }

  // ENHANCED: Method to close position with comprehensive volume format testing and improved logging - FIXED TO USE GET
  async closePosition(ticket: number, volumeToClose?: number): Promise<any> {
    try {
      if (!this.token) {
        console.warn('⚠️ Not connected to MT5 (no token) when trying to close position');
        return { retcode: 10004, comment: 'Not connected to MT5' };
      }

      console.log(`🔄 Starting enhanced closePosition for ticket ${ticket}`);

      // Step 1: Get position details to understand volume formats
      let positionDetails = null;
      try {
        const positions = await this.getPositions();
        positionDetails = positions.find(pos => pos.ticket === ticket);
        
        if (positionDetails) {
          console.log(`✅ Found position ${ticket} details:`, {
            symbol: positionDetails.symbol,
            type: positionDetails.type,
            volume: positionDetails.volume,
            rawVolume: positionDetails.rawVolume,
            profit: positionDetails.profit
          });
        } else {
          console.log(`⚠️ Position ${ticket} not found in current positions - may already be closed`);
          return {
            retcode: 10009,
            ticket: ticket,
            comment: 'Position not found - may already be closed'
          };
        }
      } catch (positionError) {
        console.warn(`⚠️ Could not fetch position details for ticket ${ticket}:`, positionError);
      }

      // Step 2: Generate comprehensive list of volume formats to try
      const volumeFormats: VolumeFormatEntry[] = [];
      
      // Add provided volume if available
      if (volumeToClose && volumeToClose > 0) {
        volumeFormats.push({
          value: volumeToClose,
          description: 'Provided volume'
        });
      }
      
      // Add position-based volumes if available
      if (positionDetails) {
        // Primary volume (lots)
        if (positionDetails.volume > 0) {
          volumeFormats.push({
            value: positionDetails.volume,
            description: 'Position lots volume'
          });
        }
        
        // Raw volume if different
        if (positionDetails.rawVolume && positionDetails.rawVolume !== positionDetails.volume) {
          volumeFormats.push({
            value: positionDetails.rawVolume,
            description: 'Position raw volume'
          });
        }
        
        // Generate scaled versions of the primary volume
        const baseVolume = positionDetails.volume;
        if (baseVolume > 0) {
          // Common scaling factors for different broker conventions
          const scalingFactors = [
            { factor: 1000, description: 'Volume × 1000 (micro lots to units)' },
            { factor: 10000, description: 'Volume × 10000 (mini lots to units)' },
            { factor: 100000, description: 'Volume × 100000 (standard lots to units)' },
            { factor: 0.001, description: 'Volume ÷ 1000 (units to micro lots)' },
            { factor: 0.0001, description: 'Volume ÷ 10000 (units to mini lots)' },
            { factor: 0.00001, description: 'Volume ÷ 100000 (units to standard lots)' },
            { factor: 10, description: 'Volume × 10' },
            { factor: 100, description: 'Volume × 100' },
            { factor: 0.1, description: 'Volume ÷ 10' },
            { factor: 0.01, description: 'Volume ÷ 100' }
          ];
          
          scalingFactors.forEach(({ factor, description }) => {
            const scaledVolume = baseVolume * factor;
            // Only add if it's a reasonable value and not already in the list
            if (scaledVolume > 0 && scaledVolume < 1000000 && 
                !volumeFormats.some(v => Math.abs(v.value - scaledVolume) < 0.000001)) {
              volumeFormats.push({
                value: scaledVolume,
                description: description
              });
            }
          });
        }
        
        // If we have rawVolume, also try scaled versions of it
        if (positionDetails.rawVolume && positionDetails.rawVolume > 0) {
          const rawScalingFactors = [1000, 0.001, 100, 0.01, 10, 0.1];
          rawScalingFactors.forEach(factor => {
            const scaledRawVolume = positionDetails.rawVolume! * factor;
            if (scaledRawVolume > 0 && scaledRawVolume < 1000000 && 
                !volumeFormats.some(v => Math.abs(v.value - scaledRawVolume) < 0.000001)) {
              volumeFormats.push({
                value: scaledRawVolume,
                description: `Raw volume × ${factor}`
              });
            }
          });
        }
      }
      
      // Add some common fallback volumes if we don't have position details
      if (volumeFormats.length === 0) {
        const fallbackVolumes = [0.01, 0.1, 1.0, 10, 100, 1000, 10000, 100000];
        fallbackVolumes.forEach(vol => {
          volumeFormats.push({
            value: vol,
            description: `Fallback volume ${vol}`
          });
        });
      }

      // Remove duplicates and sort by likelihood of success
      const uniqueFormats = volumeFormats.filter((format, index, self) => 
        index === self.findIndex(f => Math.abs(f.value - format.value) < 0.000001)
      );

      console.log(`📊 Will try ${uniqueFormats.length} volume formats:`, 
        uniqueFormats.map(f => `${f.value} (${f.description})`));

      // Step 3: Try each volume format
      for (let i = 0; i < uniqueFormats.length; i++) {
        const format = uniqueFormats[i];
        
        console.log(`📤 Attempt ${i + 1}/${uniqueFormats.length}: Trying ${format.description} = ${format.value}`);
        
        try {
          const params: any = {
            id: this.token,
            ticket: ticket,
            slippage: 10
          };

          // Try with the current volume format
          if (format.value > 0) {
            params.lots = format.value;
          }

          console.log(`📤 Sending OrderClose request:`, params);

          // FIXED: Use GET instead of POST for OrderClose endpoint
          const response = await this.apiClient.get('/OrderClose', {
            params: params
          });
          
          // ENHANCED LOGGING: Log the complete response data
          console.log(`📥 FULL Response for attempt ${i + 1}:`, {
            status: response.status,
            statusText: response.statusText,
            dataType: typeof response.data,
            data: JSON.stringify(response.data),
            rawData: response.data
          });
          
          if (response.status === 200 || response.status === 201) {
            // Use the robust response parser
            const result = this.parseOrderResponse(response.data, 'OrderClose');
            
            // ENHANCED LOGGING: Log the parsed result
            console.log(`📊 Parsed result for attempt ${i + 1}:`, result);
            
            // Check for "position already closed" scenarios - treat as success
            if (result.comment && (
                result.comment.includes('position with the specified position_identifier has already been closed') ||
                result.comment.includes('already been closed') ||
                result.comment.includes('position not exists') ||
                result.comment.includes('POSITION_NOT_EXISTS') ||
                result.comment.includes('no such position') ||
                result.comment.includes('not found'))) {
              console.log(`✅ Position ${ticket} already closed (detected in response)`);
              return {
                retcode: 10009,
                ticket: ticket,
                comment: 'Position already closed',
                volumeUsed: format.value,
                attemptNumber: i + 1
              };
            }
            
            // Check for invalid volume errors
            if (result.comment && (
                result.comment.includes('invalid volume') || 
                result.comment.includes('invalid lots') ||
                result.comment.includes('wrong volume') ||
                result.comment.includes('incorrect volume'))) {
              console.log(`⚠️ Invalid volume error with ${format.description} (${format.value})`);
              // Continue to next format
              continue;
            }
            
            if (result.retcode === 10009) {
              console.log(`✅ Position ${ticket} closed successfully with ${format.description} (${format.value}) on attempt ${i + 1}`);
              return {
                retcode: 10009,
                ticket: result.order || ticket,
                comment: result.comment || 'Position closed successfully',
                volumeUsed: format.value,
                attemptNumber: i + 1,
                formatDescription: format.description
              };
            } else {
              console.log(`❌ Attempt ${i + 1} failed: ${result.comment}`);
              if (i < uniqueFormats.length - 1) {
                console.log(`⚠️ Trying next volume format...`);
                continue;
              }
            }
          } else {
            console.log(`❌ HTTP error ${response.status} for attempt ${i + 1}`);
            if (i < uniqueFormats.length - 1) {
              console.log(`⚠️ Trying next volume format...`);
              continue;
            }
          }
        } catch (attemptError: any) {
          // ENHANCED LOGGING: Log the complete error details
          console.error(`❌ Exception in attempt ${i + 1}:`, {
            message: attemptError.message,
            stack: attemptError.stack,
            response: attemptError.response?.data,
            status: attemptError.response?.status,
            fullError: attemptError
          });
          
          // Check if it's a "position not found" error - treat as success
          if (attemptError.message && (
              attemptError.message.includes('position not found') || 
              attemptError.message.includes('already closed') ||
              attemptError.message.includes('POSITION_NOT_EXISTS') ||
              attemptError.message.includes('no such position') ||
              attemptError.message.includes('not found'))) {
            console.log(`✅ Position ${ticket} was already closed (detected in attempt ${i + 1})`);
            return {
              retcode: 10009,
              ticket: ticket,
              comment: 'Position already closed',
              volumeUsed: format.value,
              attemptNumber: i + 1
            };
          }
          
          // Check if it's an authentication error
          if (attemptError.message && (
              attemptError.message.includes('Authentication failed') || 
              attemptError.message.includes('Session expired') ||
              attemptError.message.includes('Invalid token'))) {
            
            console.log('🔑 Authentication error detected, clearing token');
            this.clearToken();
            throw attemptError; // Re-throw to handle at higher level
          }
          
          if (i < uniqueFormats.length - 1) {
            console.log(`⚠️ Exception with ${format.description}, trying next format...`);
            continue;
          }
        }
      }
      
      // If all attempts failed
      console.error(`❌ All ${uniqueFormats.length} volume formats failed to close position ${ticket}`);
      return {
        retcode: 10004,
        comment: `Failed to close position ${ticket} - tried ${uniqueFormats.length} different volume formats`
      };
      
    } catch (error: any) {
      // ENHANCED LOGGING: Log the complete error details
      console.error(`❌ Enhanced closePosition failed for ticket ${ticket}:`, {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || 
          error.message.includes('Session expired') ||
          error.message.includes('Invalid token') ||
          error.response?.status === 401) {
        
        console.log('🔑 Authentication error detected, clearing token');
        this.clearToken();
      }
      
      // Return consistent error format instead of throwing
      return {
        retcode: 10004,
        comment: error.message || 'Failed to close position'
      };
    }
  }

  // Utility Methods
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('mt5_token', token);
    console.log('🔑 MT5 token updated in localStorage and memory');
  }

  getStoredToken(): string | null {
    return localStorage.getItem('mt5_token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('mt5_token');
    console.log('🔑 MT5 token cleared from localStorage and memory');
  }

  // Get current API endpoint
  getApiEndpoint(): string {
    return this.baseURL;
  }

  // Get current token (for debugging)
  getCurrentToken(): string | null {
    return this.token;
  }
}

export default new MT5ApiService();