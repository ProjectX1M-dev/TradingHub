import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

// Define types
interface WebhookPayload {
  symbol: string;
  action: "BUY" | "SELL" | "CLOSE";
  volume?: number;
  price?: number | string;
  stopLoss?: number;
  takeProfit?: number;
  timestamp?: string;
  strategy?: string;
  userId?: string;
  botToken?: string;
  ticket?: number; // Added ticket field for targeted position closing
}

interface MT5Credentials {
  mt5_username: string;
  mt5_server: string;
  mt5_token: string;
  account_type: string;
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// MT5 API URL
const MT5_API_URL = "https://mt5.mtapi.io";

// Function to normalize symbol (remove .raw suffix for prop accounts)
function normalizeSymbol(symbol: string): string {
  // Remove any suffix like .raw, .m, etc.
  return symbol.replace(/\.(raw|m|c|pro|ecn|stp)$/i, "");
}

// Function to get MT5 symbol based on account type
function getMT5Symbol(symbol: string, accountType?: string): string {
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

// Function to get current price from MT5
async function getCurrentPrice(symbol: string, mt5Token: string): Promise<{ bid: number; ask: number } | null> {
  try {
    console.log(`🔍 [getCurrentPrice] Fetching price for ${symbol} with token: ${mt5Token.substring(0, 10)}...`);
    
    const url = `${MT5_API_URL}/GetQuote?id=${mt5Token}&symbol=${symbol}`;
    console.log(`🔍 [getCurrentPrice] Request URL: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`🔍 [getCurrentPrice] Response status: ${response.status}`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`🔍 [getCurrentPrice] Raw response: ${responseText}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ [getCurrentPrice] Error parsing JSON response: ${parseError.message}`);
        console.log(`❌ [getCurrentPrice] Raw response that failed to parse: ${responseText}`);
        return null;
      }
      
      if (data && typeof data.bid === "number" && typeof data.ask === "number") {
        console.log(`✅ [getCurrentPrice] Quote received for ${symbol}: Bid=${data.bid}, Ask=${data.ask}`);
        return {
          bid: data.bid,
          ask: data.ask
        };
      } else {
        console.log(`❌ [getCurrentPrice] Invalid quote data structure:`, data);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ [getCurrentPrice] Failed to get quote - HTTP ${response.status}: ${errorText}`);
    }
    
    return null;
  } catch (error) {
    console.error(`❌ [getCurrentPrice] Error getting price for ${symbol}:`, error);
    return null;
  }
}

// Function to get all available symbols from MT5
async function getAvailableSymbols(mt5Token: string): Promise<string[]> {
  try {
    console.log(`🔍 [getAvailableSymbols] Fetching all available symbols with token: ${mt5Token.substring(0, 10)}...`);
    
    const url = `${MT5_API_URL}/SymbolList?id=${mt5Token}`;
    console.log(`🔍 [getAvailableSymbols] Request URL: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`🔍 [getAvailableSymbols] Response status: ${response.status}`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`🔍 [getAvailableSymbols] Raw response length: ${responseText.length} characters`);
      
      let symbols: string[] = [];
      
      try {
        // Try to parse as JSON array
        const data = JSON.parse(responseText);
        if (Array.isArray(data)) {
          symbols = data.filter(symbol => typeof symbol === 'string');
        } else if (typeof data === 'object' && data !== null) {
          // Some APIs return { symbols: [...] }
          if (Array.isArray(data.symbols)) {
            symbols = data.symbols.filter((symbol: any) => typeof symbol === 'string');
          } else if (Array.isArray(data.data)) {
            symbols = data.data.filter((symbol: any) => typeof symbol === 'string');
          }
        }
      } catch (parseError) {
        console.log(`⚠️ [getAvailableSymbols] Not JSON, trying to parse as text: ${parseError.message}`);
        
        // If not JSON, try to parse as text (comma or newline separated)
        if (typeof responseText === 'string') {
          symbols = responseText
            .split(/[\n,]/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        }
      }
      
      console.log(`✅ [getAvailableSymbols] Found ${symbols.length} symbols`);
      if (symbols.length > 0) {
        console.log(`✅ [getAvailableSymbols] First 10 symbols:`, symbols.slice(0, 10));
      }
      
      return symbols;
    } else {
      const errorText = await response.text();
      console.error(`❌ [getAvailableSymbols] Failed to get symbols - HTTP ${response.status}: ${errorText}`);
      return [];
    }
  } catch (error) {
    console.error(`❌ [getAvailableSymbols] Error getting symbols:`, error);
    return [];
  }
}

// Function to subscribe to a symbol before trading
async function subscribeToSymbol(symbol: string, mt5Token: string): Promise<boolean> {
  try {
    console.log(`🔍 [subscribeToSymbol] Subscribing to symbol ${symbol} with token: ${mt5Token.substring(0, 10)}...`);
    
    const url = `${MT5_API_URL}/Subscribe?id=${mt5Token}&symbol=${symbol}`;
    console.log(`🔍 [subscribeToSymbol] Request URL: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`🔍 [subscribeToSymbol] Response status: ${response.status}`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`🔍 [subscribeToSymbol] Raw response: ${responseText}`);
      
      // Any 200 response is considered success
      console.log(`✅ [subscribeToSymbol] Successfully subscribed to ${symbol}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ [subscribeToSymbol] Failed to subscribe - HTTP ${response.status}: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ [subscribeToSymbol] Error subscribing to ${symbol}:`, error);
    return false;
  }
}

// Function to find the best matching symbol from available symbols
async function findMatchingSymbol(baseSymbol: string, mt5Token: string): Promise<string | null> {
  try {
    console.log(`🔍 [findMatchingSymbol] Finding matching symbol for: ${baseSymbol}`);
    
    // Normalize the base symbol (remove any suffix)
    const normalizedSymbol = normalizeSymbol(baseSymbol);
    console.log(`🔍 [findMatchingSymbol] Normalized symbol: ${normalizedSymbol}`);
    
    // Get all available symbols
    const allSymbols = await getAvailableSymbols(mt5Token);
    console.log(`🔍 [findMatchingSymbol] Found ${allSymbols.length} symbols from broker`);
    
    if (allSymbols.length === 0) {
      console.error('❌ [findMatchingSymbol] No symbols available from broker');
      return null;
    }
    
    // First, check for exact match
    if (allSymbols.includes(baseSymbol)) {
      console.log(`✅ [findMatchingSymbol] Found exact match for ${baseSymbol}`);
      return baseSymbol;
    }
    
    // Then check for normalized match
    if (allSymbols.includes(normalizedSymbol)) {
      console.log(`✅ [findMatchingSymbol] Found normalized match for ${normalizedSymbol}`);
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
        console.log(`✅ [findMatchingSymbol] Found ${goldCandidates.length} gold-related symbols:`, goldCandidates);
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
        console.log(`✅ [findMatchingSymbol] Found ${silverCandidates.length} silver-related symbols:`, silverCandidates);
        return silverCandidates[0];
      }
    }
    
    // For other symbols, try to find partial matches
    const partialMatches = allSymbols.filter(sym => 
      sym.includes(normalizedSymbol) || 
      normalizedSymbol.includes(sym)
    );
    
    if (partialMatches.length > 0) {
      console.log(`✅ [findMatchingSymbol] Found ${partialMatches.length} partial matches:`, partialMatches);
      return partialMatches[0];
    }
    
    // If no matches found, log all available symbols for debugging
    console.error(`❌ [findMatchingSymbol] No matching symbol found for ${baseSymbol}. Available symbols:`, allSymbols.slice(0, 20), '...');
    return null;
  } catch (error) {
    console.error(`❌ [findMatchingSymbol] Error finding matching symbol for ${baseSymbol}:`, error);
    return null;
  }
}

// Function to execute a trade on MT5 - FIXED TO USE GET FOR ALL OPERATIONS
async function executeTrade(
  payload: WebhookPayload,
  mt5Credentials: MT5Credentials
): Promise<{ success: boolean; message: string; orderId?: number }> {
  try {
    // Normalize the symbol (remove any suffix)
    const normalizedSymbol = normalizeSymbol(payload.symbol);
    
    console.log(`🔄 [executeTrade] Normalized symbol: ${normalizedSymbol}`);
    console.log(`🔄 [executeTrade] MT5 Credentials: Username=${mt5Credentials.mt5_username}, Server=${mt5Credentials.mt5_server}, Account Type=${mt5Credentials.account_type}`);
    console.log(`🔄 [executeTrade] MT5 Token (first 10 chars): ${mt5Credentials.mt5_token.substring(0, 10)}...`);
    
    // Find the best matching symbol from the broker
    const matchingSymbol = await findMatchingSymbol(normalizedSymbol, mt5Credentials.mt5_token);
    
    let mt5Symbol: string;
    
    if (matchingSymbol) {
      console.log(`✅ [executeTrade] Found matching symbol: ${matchingSymbol} for normalized symbol: ${normalizedSymbol}`);
      mt5Symbol = matchingSymbol;
      
      // Subscribe to the symbol before trading
      const subscribed = await subscribeToSymbol(mt5Symbol, mt5Credentials.mt5_token);
      if (subscribed) {
        console.log(`✅ [executeTrade] Successfully subscribed to symbol: ${mt5Symbol}`);
      } else {
        console.warn(`⚠️ [executeTrade] Failed to subscribe to symbol: ${mt5Symbol}, but will attempt to trade anyway`);
      }
    } else {
      // If no matching symbol found, try with the account-type-specific symbol
      console.warn(`⚠️ [executeTrade] No matching symbol found, falling back to account-type-specific symbol`);
      mt5Symbol = getMT5Symbol(normalizedSymbol, mt5Credentials.account_type);
      console.log(`🔄 [executeTrade] Using account-type-specific symbol: ${mt5Symbol}`);
    }
    
    console.log(`🔄 [executeTrade] Final symbol for trading: ${mt5Symbol}`);
    
    // For CLOSE action, handle position closing
    if (payload.action === "CLOSE") {
      console.log(`🔄 [executeTrade] Processing CLOSE action for ${mt5Symbol}`);
      
      // Check if a specific ticket was provided for targeted closing
      if (payload.ticket) {
        console.log(`🔄 [executeTrade] Closing specific position with ticket ${payload.ticket}`);
        
        // Get position details to understand volume formats
        const positionsUrl = `${MT5_API_URL}/OpenedOrders?id=${mt5Credentials.mt5_token}`;
        console.log(`🔄 [executeTrade] Fetching open positions to verify ticket: ${positionsUrl}`);
        
        const positionsResponse = await fetch(positionsUrl);
        
        if (!positionsResponse.ok) {
          const errorText = await positionsResponse.text();
          console.error(`❌ [executeTrade] Failed to fetch open positions: ${errorText}`);
          return { success: false, message: `Failed to fetch open positions: ${errorText}` };
        }
        
        const positionsText = await positionsResponse.text();
        
        let positions;
        try {
          positions = JSON.parse(positionsText);
        } catch (parseError) {
          console.error(`❌ [executeTrade] Error parsing positions JSON: ${parseError.message}`);
          return { success: false, message: `Error parsing positions response: ${parseError.message}` };
        }
        
        if (!Array.isArray(positions)) {
          console.error(`❌ [executeTrade] Positions response is not an array:`, positions);
          return { success: false, message: "Invalid positions response format" };
        }
        
        // Find the specific position by ticket
        const position = positions.find(pos => pos.ticket === payload.ticket);
        
        if (!position) {
          console.log(`ℹ️ [executeTrade] Position with ticket ${payload.ticket} not found - may already be closed`);
          return { success: true, message: `Position ${payload.ticket} not found or already closed` };
        }
        
        console.log(`🔄 [executeTrade] Found position ${payload.ticket} to close:`, {
          symbol: position.symbol,
          type: position.orderType,
          volume: position.lots || position.volume
        });
        
        // Close the specific position
        const closeParams = new URLSearchParams({
          id: mt5Credentials.mt5_token,
          ticket: payload.ticket.toString(),
          slippage: "10"
        });
        
        // Add volume if available
        if (position.lots) {
          closeParams.append("lots", position.lots.toString());
        } else if (position.volume) {
          closeParams.append("lots", position.volume.toString());
        }
        
        const closeUrl = `${MT5_API_URL}/OrderClose?${closeParams.toString()}`;
        
        console.log(`🔄 [executeTrade] Closing position ${payload.ticket} with GET request to: ${closeUrl}`);
        
        const closeResponse = await fetch(closeUrl, {
          method: 'GET'
        });
        
        const closeResponseText = await closeResponse.text();
        
        console.log(`🔄 [executeTrade] Close response for ticket ${payload.ticket}: Status=${closeResponse.status}, Body=${closeResponseText}`);
        
        if (closeResponse.ok) {
          console.log(`✅ [executeTrade] Successfully closed position ${payload.ticket}`);
          return { 
            success: true, 
            message: `Closed position ${payload.ticket} successfully` 
          };
        } else {
          console.error(`❌ [executeTrade] Failed to close position ${payload.ticket}: ${closeResponseText}`);
          return { 
            success: false, 
            message: `Failed to close position ${payload.ticket}: ${closeResponseText}` 
          };
        }
      } else {
        // If no specific ticket provided, close all positions for the symbol
        // Get all open positions
        const positionsUrl = `${MT5_API_URL}/OpenedOrders?id=${mt5Credentials.mt5_token}`;
        console.log(`🔄 [executeTrade] Fetching open positions: ${positionsUrl}`);
        
        const positionsResponse = await fetch(positionsUrl);
        
        console.log(`🔄 [executeTrade] Positions response status: ${positionsResponse.status}`);
        
        if (!positionsResponse.ok) {
          const errorText = await positionsResponse.text();
          console.error(`❌ [executeTrade] Failed to fetch open positions: ${errorText}`);
          return { success: false, message: `Failed to fetch open positions: ${errorText}` };
        }
        
        const positionsText = await positionsResponse.text();
        console.log(`🔄 [executeTrade] Raw positions response: ${positionsText}`);
        
        let positions;
        try {
          positions = JSON.parse(positionsText);
        } catch (parseError) {
          console.error(`❌ [executeTrade] Error parsing positions JSON: ${parseError.message}`);
          return { success: false, message: `Error parsing positions response: ${parseError.message}` };
        }
        
        if (!Array.isArray(positions) || positions.length === 0) {
          console.log(`ℹ️ [executeTrade] No open positions found`);
          return { success: false, message: "No open positions found" };
        }
        
        console.log(`🔄 [executeTrade] Found ${positions.length} open positions`);
        
        // Filter positions for the specified symbol
        const symbolPositions = positions.filter(pos => 
          pos.symbol === mt5Symbol && (pos.orderType === "Buy" || pos.orderType === "Sell")
        );
        
        console.log(`🔄 [executeTrade] Found ${symbolPositions.length} positions for ${mt5Symbol}`);
        
        if (symbolPositions.length === 0) {
          return { success: false, message: `No open positions found for ${mt5Symbol}` };
        }
        
        // Close each position
        let closedCount = 0;
        for (const position of symbolPositions) {
          try {
            // FIXED: Use GET instead of POST for closing positions
            const closeParams = new URLSearchParams({
              id: mt5Credentials.mt5_token,
              ticket: position.ticket.toString(),
              slippage: "10"
            });
            
            // Add volume if available
            if (position.lots) {
              closeParams.append("lots", position.lots.toString());
            } else if (position.volume) {
              closeParams.append("lots", position.volume.toString());
            }
            
            const closeUrl = `${MT5_API_URL}/OrderClose?${closeParams.toString()}`;
            
            console.log(`🔄 [executeTrade] Closing position ${position.ticket} with GET request to: ${closeUrl}`);
            
            const closeResponse = await fetch(closeUrl, {
              method: 'GET'
            });
            
            console.log(`🔄 [executeTrade] Close response status: ${closeResponse.status}, statusText: ${closeResponse.statusText}`);
            
            const closeResponseText = await closeResponse.text();
            
            console.log(`🔄 [executeTrade] Close response for ticket ${position.ticket}: Status=${closeResponse.status}, Body=${closeResponseText}`);
            
            if (closeResponse.ok) {
              closedCount++;
              console.log(`✅ [executeTrade] Successfully closed position ${position.ticket}`);
            } else {
              console.error(`❌ [executeTrade] Failed to close position ${position.ticket}: ${closeResponseText}`);
            }
          } catch (error) {
            console.error(`❌ [executeTrade] Error closing position ${position.ticket}:`, error);
          }
        }
        
        if (closedCount > 0) {
          return { 
            success: true, 
            message: `Closed ${closedCount} of ${symbolPositions.length} positions for ${mt5Symbol}` 
          };
        } else {
          return { 
            success: false, 
            message: `Failed to close any positions for ${mt5Symbol}` 
          };
        }
      }
    }
    
    // For BUY/SELL actions, execute the trade
    const operation = payload.action === "BUY" ? "Buy" : "Sell";
    
    // Build the request parameters
    const orderParams = new URLSearchParams({
      id: mt5Credentials.mt5_token,
      symbol: mt5Symbol,
      operation: operation,
      slippage: "10",
      expertID: "0"
    });
    
    // Add volume parameter
    if (payload.volume) {
      orderParams.append("volume", payload.volume.toString());
    } else {
      orderParams.append("volume", "0.01"); // Default to 0.01 lots if not specified
    }
    
    // We're intentionally NOT adding price parameter to force market execution
    
    // Add stop loss and take profit if provided
    if (payload.stopLoss) {
      orderParams.append("stoploss", payload.stopLoss.toString());
    }
    
    if (payload.takeProfit) {
      orderParams.append("takeprofit", payload.takeProfit.toString());
    }
    
    // Add comment if provided
    if (payload.strategy) {
      orderParams.append("comment", payload.strategy);
    }
    
    console.log(`🔄 [executeTrade] Executing market order with parameters:`, Object.fromEntries(orderParams));
    
    // FIXED: Use GET instead of POST for OrderSend
    const orderSendUrl = `${MT5_API_URL}/OrderSend?${orderParams.toString()}`;
    console.log(`🔄 [executeTrade] GET request to ${orderSendUrl}`);
    
    const response = await fetch(orderSendUrl, {
      method: 'GET'
    });
    
    console.log(`🔄 [executeTrade] MT5 API response status: ${response.status}, statusText: ${response.statusText}`);
    console.log(`🔄 [executeTrade] Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [executeTrade] MT5 API returned error status: ${response.status}: ${errorText}`);
      return { 
        success: false, 
        message: `MT5 API returned status ${response.status}: ${errorText}` 
      };
    }
    
    // Parse the response
    const responseText = await response.text();
    console.log(`🔄 [executeTrade] MT5 API raw response:`, responseText);
    
    // Check if the response is a number (ticket ID)
    const ticketId = parseInt(responseText, 10);
    if (!isNaN(ticketId) && ticketId > 0) {
      console.log(`✅ [executeTrade] Order executed successfully with ticket ${ticketId}`);
      return { 
        success: true, 
        message: `Order executed successfully with ticket ${ticketId}`,
        orderId: ticketId
      };
    }
    
    // Try to parse as JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log(`🔄 [executeTrade] Parsed JSON response:`, jsonResponse);
      
      // Check for success indicators in the JSON response
      if (jsonResponse.retcode === 10009 || 
          (jsonResponse.ticket && jsonResponse.ticket > 0) ||
          jsonResponse.success === true) {
        console.log(`✅ [executeTrade] Order executed successfully based on JSON response`);
        return { 
          success: true, 
          message: jsonResponse.comment || "Order executed successfully",
          orderId: jsonResponse.ticket || jsonResponse.order
        };
      } else {
        console.error(`❌ [executeTrade] JSON response indicates failure:`, jsonResponse);
        return { 
          success: false, 
          message: jsonResponse.comment || "Failed to execute order" 
        };
      }
    } catch (error) {
      console.log(`🔄 [executeTrade] Response is not JSON, checking for success indicators in text`);
      
      // Not JSON, check if it contains success indicators
      if (responseText.toLowerCase().includes("success") || 
          responseText.toLowerCase().includes("executed")) {
        console.log(`✅ [executeTrade] Order executed successfully based on text response`);
        return { success: true, message: responseText };
      } else {
        console.error(`❌ [executeTrade] Text response indicates failure:`, responseText);
        return { success: false, message: responseText || "Unknown error" };
      }
    }
  } catch (error) {
    console.error(`❌ [executeTrade] Unexpected error executing trade:`, error);
    return { success: false, message: error.message || "Unknown error" };
  }
}

// Main webhook handler
serve(async (req) => {
  console.log(`📥 [webhook] Received request: ${req.method} ${req.url}`);
  console.log(`📥 [webhook] Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log(`📥 [webhook] Handling OPTIONS preflight request`);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Check content type
    const contentType = req.headers.get("content-type") || "";
    console.log(`📥 [webhook] Content-Type: ${contentType}`);
    
    if (!contentType.includes("application/json")) {
      console.error(`❌ [webhook] Invalid content type: ${contentType}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Invalid content type. Expected application/json but got: ${contentType}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the raw request body as text first
    let rawBody;
    try {
      rawBody = await req.text();
      console.log("📥 [webhook] Received raw webhook payload:", rawBody);
    } catch (error) {
      console.error("❌ [webhook] Error reading request body:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error reading request body: " + error.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Try to parse the JSON
    let payload: WebhookPayload;
    try {
      // Trim the body to remove any whitespace
      const trimmedBody = rawBody.trim();
      payload = JSON.parse(trimmedBody);
      console.log("📥 [webhook] Parsed webhook payload:", payload);
    } catch (error) {
      console.error("❌ [webhook] Error parsing JSON:", error);
      console.error("❌ [webhook] Raw payload that failed to parse:", rawBody);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid JSON format: " + error.message,
          rawPayload: rawBody,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate required fields
    if (!payload.symbol) {
      throw new Error("Symbol is required");
    }

    if (!payload.action || !["BUY", "SELL", "CLOSE"].includes(payload.action)) {
      throw new Error("Valid action (BUY, SELL, CLOSE) is required");
    }

    // Check for userId
    if (!payload.userId) {
      throw new Error("userId is required in the webhook payload");
    }

    // Normalize the timestamp
    const timestamp = payload.timestamp || new Date().toISOString();

    // Store the webhook payload in the database
    const { data: webhookLog, error: webhookError } = await supabase
      .from("webhook_logs")
      .insert({
        user_id: payload.userId,
        payload: payload,
        source: "tradingview",
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error("❌ [webhook] Error storing webhook:", webhookError);
      throw new Error("Failed to store webhook data");
    }

    console.log("✅ [webhook] Webhook stored with ID:", webhookLog.id);

    // Find active robots for this user and symbol
    let robotQuery = supabase
      .from("trading_robots")
      .select("*")
      .eq("user_id", payload.userId)
      .eq("is_active", true);

    // If botToken is provided, use it to target a specific robot
    if (payload.botToken) {
      console.log(`🔍 [webhook] Looking for robot with specific botToken: ${payload.botToken}`);
      robotQuery = robotQuery.eq("bot_token", payload.botToken);
    } else {
      // Otherwise, find robots that match the symbol or have null symbol (all symbols)
      console.log(`🔍 [webhook] Looking for robots matching symbol: ${payload.symbol} or with null symbol`);
      robotQuery = robotQuery.or(`symbol.eq.${payload.symbol},symbol.is.null`);
    }

    const { data: robots, error: robotsError } = await robotQuery;

    if (robotsError) {
      console.error("❌ [webhook] Error finding robots:", robotsError);
      throw new Error("Failed to find matching robots");
    }

    console.log(`🔍 [webhook] Found ${robots?.length || 0} matching robots`);

    if (!robots || robots.length === 0) {
      // Create signal record but mark as pending (no robot to execute it)
      console.log(`⚠️ [webhook] No active robots found for symbol: ${payload.symbol}`);
      
      await supabase.from("trading_signals").insert({
        user_id: payload.userId,
        symbol: payload.symbol,
        action: payload.action,
        volume: payload.volume || 0.01,
        price: null, // Don't store price - we'll use market execution
        stop_loss: payload.stopLoss,
        take_profit: payload.takeProfit,
        source: "tradingview",
        status: "pending",
        bot_token: payload.botToken,
        ticket: payload.ticket, // Store ticket for targeted position closing
      });

      // Update webhook log
      await supabase
        .from("webhook_logs")
        .update({
          processed: true,
          error_message: "No active robots found for this symbol",
        })
        .eq("id", webhookLog.id);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Signal created but no active robots found to execute it",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sort robots to prioritize symbol-specific robots over "all symbols" robots
    const sortedRobots = [...robots].sort((a, b) => {
      // Symbol-specific robots come first
      if (a.symbol === payload.symbol && b.symbol !== payload.symbol) return -1;
      if (a.symbol !== payload.symbol && b.symbol === payload.symbol) return 1;
      // Then sort by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Get the best matching robot
    const robot = sortedRobots[0];
    console.log("✅ [webhook] Selected robot for execution:", {
      id: robot.id,
      name: robot.name,
      symbol: robot.symbol || "All Symbols",
      isActive: robot.is_active
    });

    // Get user's MT5 credentials
    const { data: userAccount, error: accountError } = await supabase
      .from("user_accounts")
      .select("*")
      .eq("user_id", payload.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (accountError) {
      console.error("❌ [webhook] Error finding user account:", accountError);
      throw new Error("No active MT5 account found");
    }

    if (!userAccount) {
      console.error("❌ [webhook] No active MT5 account found for user:", payload.userId);
      throw new Error("No active MT5 account found");
    }

    console.log(`✅ [webhook] Found active MT5 account: ${userAccount.mt5_username}@${userAccount.mt5_server} (${userAccount.account_type})`);

    if (!userAccount.mt5_token) {
      console.error("❌ [webhook] No MT5 token found for user:", payload.userId);
      throw new Error("MT5 token not found. Please reconnect your broker account.");
    }

    // Prepare MT5 credentials
    const mt5Credentials: MT5Credentials = {
      mt5_username: userAccount.mt5_username,
      mt5_server: userAccount.mt5_server,
      mt5_token: userAccount.mt5_token,
      account_type: userAccount.account_type || "live",
    };

    // Prepare the final signal with robot settings
    const finalSignal: WebhookPayload = {
      ...payload,
      // Use provided volume or robot's max lot size
      volume: payload.volume || robot.max_lot_size,
      // Remove price to force market execution
      price: undefined
    };

    // Create signal record
    const { data: signal, error: signalError } = await supabase
      .from("trading_signals")
      .insert({
        user_id: payload.userId,
        symbol: payload.symbol,
        action: payload.action,
        volume: finalSignal.volume,
        price: null, // Don't store price - we'll use market execution
        stop_loss: finalSignal.stopLoss,
        take_profit: finalSignal.takeProfit,
        source: "tradingview",
        status: "pending",
        bot_token: payload.botToken || robot.bot_token,
        ticket: payload.ticket, // Store ticket for targeted position closing
      })
      .select()
      .single();

    if (signalError) {
      console.error("❌ [webhook] Error creating signal:", signalError);
      throw new Error("Failed to create signal record");
    }

    console.log("✅ [webhook] Signal created with ID:", signal.id);

    // Execute the trade
    console.log(`🔄 [webhook] Executing trade with final signal:`, finalSignal);
    const tradeResult = await executeTrade(finalSignal, mt5Credentials);
    console.log("🔄 [webhook] Trade execution result:", tradeResult);

    // Update signal status
    await supabase
      .from("trading_signals")
      .update({
        status: tradeResult.success ? "executed" : "failed",
        executed_at: tradeResult.success ? new Date().toISOString() : null,
      })
      .eq("id", signal.id);

    // Update webhook log
    await supabase
      .from("webhook_logs")
      .update({
        processed: true,
        error_message: tradeResult.success ? null : tradeResult.message,
      })
      .eq("id", webhookLog.id);

    // Return the response
    return new Response(
      JSON.stringify({
        success: tradeResult.success,
        message: tradeResult.message,
        signalId: signal.id,
        orderId: tradeResult.orderId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [webhook] Error processing webhook:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});