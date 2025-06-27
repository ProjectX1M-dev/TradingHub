import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AddTokensRequest {
  userId: string;
  amount: number;
  description: string;
  adminCredentials: {
    username: string;
    password: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin credentials
    const { userId, amount, description, adminCredentials }: AddTokensRequest = await req.json()
    
    // Simple admin verification (in production, use proper JWT or session-based auth)
    if (adminCredentials.username !== 'admin' || adminCredentials.password !== 'admin123') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized admin access' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate input
    if (!userId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        { 
          status: 400, 
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

    // Get current user tokens
    const { data: currentTokens, error: fetchError } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching user tokens:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user token data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let newBalance: number, newEarned: number

    if (!currentTokens) {
      // Create new token record
      newBalance = amount
      newEarned = amount
      
      const { error: createError } = await supabaseAdmin
        .from('user_tokens')
        .insert({
          user_id: userId,
          balance: newBalance,
          earned: newEarned,
          spent: 0
        })

      if (createError) {
        console.error('Error creating user tokens:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user token record' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      // Update existing record
      newBalance = currentTokens.balance + amount
      newEarned = currentTokens.earned + amount
      
      const { error: updateError } = await supabaseAdmin
        .from('user_tokens')
        .update({
          balance: newBalance,
          earned: newEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating user tokens:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update user tokens' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('token_transactions')
      .insert({
        user_id: userId,
        type: 'earned',
        amount: amount,
        description: description,
        related_service: 'admin'
      })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      // Don't fail the operation for transaction logging error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        newBalance, 
        newEarned,
        message: `Successfully added ${amount} tokens to user` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Admin add tokens error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})