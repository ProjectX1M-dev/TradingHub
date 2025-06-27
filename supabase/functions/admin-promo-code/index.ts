import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AdminCredentials {
  username: string;
  password: string;
}

interface PromoData {
  code: string;
  discountPercent: number;
  maxUses: number;
  expiresAt: string | null;
  isActive: boolean;
}

interface AdminPromoRequest {
  action: 'create' | 'update' | 'delete' | 'toggle';
  promoId?: string;
  promoData?: PromoData;
  isActive?: boolean;
  adminCredentials: AdminCredentials;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const requestData: AdminPromoRequest = await req.json()
    const { action, promoId, promoData, isActive, adminCredentials } = requestData
    
    // Verify admin credentials
    if (adminCredentials.username !== 'admin' || adminCredentials.password !== 'admin123') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized admin access' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Handle different actions
    if (action === 'create' && promoData) {
      // Create new promo code
      const { data, error } = await supabaseAdmin
        .from('promo_codes')
        .insert({
          code: promoData.code,
          discount_percent: promoData.discountPercent,
          max_uses: promoData.maxUses,
          expires_at: promoData.expiresAt,
          is_active: promoData.isActive,
          used_count: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating promo code:', error)
        return new Response(
          JSON.stringify({ error: `Failed to create promo code: ${error.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Promo code created successfully',
          data
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } 
    else if (action === 'update' && promoId && promoData) {
      // Update existing promo code
      const { data, error } = await supabaseAdmin
        .from('promo_codes')
        .update({
          discount_percent: promoData.discountPercent,
          max_uses: promoData.maxUses,
          expires_at: promoData.expiresAt,
          is_active: promoData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', promoId)
        .select()
        .single()

      if (error) {
        console.error('Error updating promo code:', error)
        return new Response(
          JSON.stringify({ error: `Failed to update promo code: ${error.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Promo code updated successfully',
          data
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    else if (action === 'delete' && promoId) {
      // Delete promo code
      const { error } = await supabaseAdmin
        .from('promo_codes')
        .delete()
        .eq('id', promoId)

      if (error) {
        console.error('Error deleting promo code:', error)
        return new Response(
          JSON.stringify({ error: `Failed to delete promo code: ${error.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Promo code deleted successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    else if (action === 'toggle' && promoId !== undefined && isActive !== undefined) {
      // Toggle promo code active status
      const { data, error } = await supabaseAdmin
        .from('promo_codes')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', promoId)
        .select()
        .single()

      if (error) {
        console.error('Error toggling promo code status:', error)
        return new Response(
          JSON.stringify({ error: `Failed to toggle promo code status: ${error.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Promo code ${isActive ? 'activated' : 'deactivated'} successfully`,
          data
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid action or missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Admin promo code error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})