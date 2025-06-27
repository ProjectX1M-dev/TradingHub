import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

// Define types
interface PaymentRequest {
  packageId: string;
  amount: number;
  tokens: number;
  userId: string;
  promoCode?: string;
  paymentMethod: 'card' | 'crypto';
  paymentDetails: any;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    country: string;
    postalCode?: string;
    phone?: string;
  };
}

interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  newBalance?: number;
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

// Main handler
serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request
    const requestData: PaymentRequest = await req.json();
    const { packageId, amount, tokens, userId, promoCode, paymentMethod, customerInfo } = requestData;
    
    // Validate required fields
    if (!packageId || !amount || !tokens || !userId || !customerInfo) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required fields"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`📥 [process-payment] Processing payment for user ${userId}:`, {
      packageId,
      amount,
      tokens,
      paymentMethod,
      promoCode: promoCode || 'None'
    });
    
    // In a real implementation, you would process the payment with a payment provider here
    // For this example, we'll simulate a successful payment
    
    // If promo code was provided, use it
    if (promoCode) {
      const { data: usePromoResult, error: usePromoError } = await supabase
        .rpc('use_promo_code', { code_to_use: promoCode });
      
      if (usePromoError) {
        console.error(`❌ [process-payment] Error using promo code: ${usePromoError.message}`);
      } else if (usePromoResult) {
        console.log(`✅ [process-payment] Successfully used promo code: ${promoCode}`);
      } else {
        console.warn(`⚠️ [process-payment] Failed to use promo code: ${promoCode}`);
      }
    }
    
    // Get current user tokens
    const { data: currentTokens, error: fetchError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ [process-payment] Error fetching user tokens:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to fetch user token data"
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    let newBalance: number, newEarned: number;

    if (!currentTokens) {
      // Create new token record
      newBalance = tokens;
      newEarned = tokens;
      
      const { error: createError } = await supabase
        .from('user_tokens')
        .insert({
          user_id: userId,
          balance: newBalance,
          earned: newEarned,
          spent: 0
        });

      if (createError) {
        console.error('❌ [process-payment] Error creating user tokens:', createError);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to create user token record"
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } else {
      // Update existing record
      newBalance = currentTokens.balance + tokens;
      newEarned = currentTokens.earned + tokens;
      
      const { error: updateError } = await supabase
        .from('user_tokens')
        .update({
          balance: newBalance,
          earned: newEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [process-payment] Error updating user tokens:', updateError);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to update user tokens"
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        type: 'purchased',
        amount: tokens,
        description: `Purchased ${tokens} tokens (${packageId} package)`,
        related_service: 'payment'
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ [process-payment] Error creating transaction record:', transactionError);
      // Don't fail the operation for transaction logging error
    }

    // Create payment record (in a real implementation)
    // This would store payment details, customer info, etc.
    
    console.log(`✅ [process-payment] Successfully processed payment for user ${userId}`);
    console.log(`✅ [process-payment] New token balance: ${newBalance}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully purchased ${tokens} tokens!`,
        transactionId: transaction?.id || 'unknown',
        newBalance
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error(`❌ [process-payment] Error processing payment: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error processing payment: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});