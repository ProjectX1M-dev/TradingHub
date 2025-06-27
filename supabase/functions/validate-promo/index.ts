import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

// Define types
interface PromoRequest {
  code: string;
}

interface PromoResponse {
  isValid: boolean;
  discountPercent: number;
  message: string;
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
    const requestData: PromoRequest = await req.json();
    const { code } = requestData;
    
    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({
          isValid: false,
          discountPercent: 0,
          message: "Promo code is required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`📥 [validate-promo] Validating promo code: "${code}"`);
    
    // Call the validate_promo_code function
    const { data, error } = await supabase
      .rpc('validate_promo_code', { code_to_check: code });
    
    if (error) {
      console.error(`❌ [validate-promo] Error validating promo code: ${error.message}`);
      return new Response(
        JSON.stringify({
          isValid: false,
          discountPercent: 0,
          message: `Error validating promo code: ${error.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (!data || data.length === 0) {
      console.error(`❌ [validate-promo] No data returned from validate_promo_code function`);
      return new Response(
        JSON.stringify({
          isValid: false,
          discountPercent: 0,
          message: "Error validating promo code: No data returned"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const result = data[0];
    console.log(`✅ [validate-promo] Validation result:`, result);
    
    // Return the response
    const response: PromoResponse = {
      isValid: result.is_valid,
      discountPercent: result.discount_percent,
      message: result.message
    };
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error(`❌ [validate-promo] Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        isValid: false,
        discountPercent: 0,
        message: `Error processing request: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});