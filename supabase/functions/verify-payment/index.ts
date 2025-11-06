import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    const { companionId, transactionSignature, amount } = await req.json();

    if (!companionId || !transactionSignature || !amount) {
      throw new Error('Missing required fields');
    }

    console.log('Verifying payment:', { companionId, transactionSignature, amount, userId: user.id });

    // Get companion details
    const { data: companion, error: companionError } = await supabase
      .from('ai_companions')
      .select('access_price, creator_id')
      .eq('id', companionId)
      .single();

    if (companionError || !companion) {
      throw new Error('Companion not found');
    }

    // Verify amount matches
    if (Number(amount) !== Number(companion.access_price)) {
      throw new Error('Payment amount does not match required price');
    }

    // Check if user already has access
    const { data: existingAccess } = await supabase
      .from('companion_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('companion_id', companionId)
      .maybeSingle();

    if (existingAccess) {
      return new Response(
        JSON.stringify({ success: true, message: 'Access already granted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create access record
    const { error: accessError } = await supabase
      .from('companion_access')
      .insert({
        user_id: user.id,
        companion_id: companionId,
        access_price: amount,
        transaction_signature: transactionSignature,
      });

    if (accessError) {
      console.error('Error creating access record:', accessError);
      throw new Error('Failed to grant access');
    }

    // If companion has a creator, create earnings record
    if (companion.creator_id) {
      const creatorAmount = Number(amount) * 0.7; // 70% to creator
      const { error: earningsError } = await supabase
        .from('creator_earnings')
        .insert({
          creator_id: companion.creator_id,
          companion_id: companionId,
          amount: creatorAmount,
          status: 'pending',
        });

      if (earningsError) {
        console.error('Error creating earnings record:', earningsError);
      }
    }

    console.log('Payment verified successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Access granted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});