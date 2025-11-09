import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "https://esm.sh/@solana/web3.js@1.95.0";

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
      .select('access_price, creator_id, name')
      .eq('id', companionId)
      .single();

    if (companionError || !companion) {
      throw new Error('Companion not found');
    }

    // Verify amount matches
    if (Number(amount) !== Number(companion.access_price)) {
      throw new Error('Payment amount does not match required price');
    }

    // Verify transaction on-chain
    console.log('Verifying transaction on Solana blockchain...');
    const PLATFORM_WALLET = '5UD8QQ5WrJFXYcN7yy1iUkhvHoa6hyko4f9Wa3EDDeJ3';
    
    // RPC endpoints with Helius as primary
    const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
    const RPC_ENDPOINTS = [
      heliusApiKey ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}` : null,
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
    ].filter(Boolean) as string[];

    console.log(`Using ${RPC_ENDPOINTS.length} RPC endpoints for verification`);
    
    // Try each RPC endpoint with retry logic
    let transaction = null;
    let lastError: Error | null = null;

    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        console.log(`Attempting verification with RPC: ${rpcUrl.includes('helius') ? 'Helius' : 'Public'}`);
        const connection = new Connection(rpcUrl, 'confirmed');
        
        // Retry logic for each endpoint
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            transaction = await connection.getTransaction(transactionSignature, {
              maxSupportedTransactionVersion: 0,
            });
            
            if (transaction) {
              console.log(`Transaction found on attempt ${attempt + 1} using ${rpcUrl.includes('helius') ? 'Helius' : 'Public RPC'}`);
              break;
            }
          } catch (fetchError) {
            console.warn(`Attempt ${attempt + 1}/3 failed for ${rpcUrl}:`, fetchError instanceof Error ? fetchError.message : fetchError);
            if (attempt < 2) {
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            }
          }
        }
        
        if (transaction) break; // Success, exit RPC loop
      } catch (rpcError) {
        lastError = rpcError instanceof Error ? rpcError : new Error(String(rpcError));
        console.error(`RPC endpoint ${rpcUrl} failed:`, lastError.message);
        continue; // Try next endpoint
      }
    }
    
    try {
      if (!transaction) {
        throw new Error(`Transaction not found on blockchain after trying all RPC endpoints. Last error: ${lastError?.message || 'Unknown'}`);
      }

      if (!transaction) {
        throw new Error('Transaction not found on blockchain');
      }

      if (transaction?.meta?.err) {
        throw new Error('Transaction failed on blockchain');
      }

      // Verify the transaction has the correct recipient and amount
      const accountKeys = transaction!.transaction.message.getAccountKeys();
      const instructions = transaction!.transaction.message.compiledInstructions;
      
      // Check if this is a system program transfer
      let foundValidTransfer = false;
      for (const instruction of instructions) {
        const programId = accountKeys.get(instruction.programIdIndex);
        if (programId?.toBase58() === '11111111111111111111111111111111') {
          // System program - decode transfer instruction
          const fromPubkey = accountKeys.get(instruction.accountKeyIndexes[0]);
          const toPubkey = accountKeys.get(instruction.accountKeyIndexes[1]);
          
          if (toPubkey?.toBase58() === PLATFORM_WALLET) {
            // Verify amount from pre/post balances
            const preBalances = transaction!.meta?.preBalances || [];
            const postBalances = transaction!.meta?.postBalances || [];
            const recipientIndex = instruction.accountKeyIndexes[1];
            const transferredLamports = postBalances[recipientIndex] - preBalances[recipientIndex];
            const transferredSOL = transferredLamports / LAMPORTS_PER_SOL;
            
            if (Math.abs(transferredSOL - Number(amount)) < 0.000001) {
              foundValidTransfer = true;
              console.log('Valid transfer verified:', {
                from: fromPubkey?.toBase58(),
                to: toPubkey.toBase58(),
                amount: transferredSOL,
              });
              break;
            }
          }
        }
      }

      if (!foundValidTransfer) {
        throw new Error('No valid transfer found to platform wallet with correct amount');
      }

      console.log('On-chain verification successful');
    } catch (verifyError) {
      console.error('On-chain verification failed:', verifyError);
      throw new Error(`Transaction verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`);
    }

    // Check if user already has access (idempotency)
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

    // Send purchase confirmation email
    try {
      // Create admin client to access user data
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.id);
      const userEmail = userData?.user?.email;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (userEmail) {
        await supabase.functions.invoke('send-purchase-email', {
          body: {
            userEmail,
            userName: profileData?.display_name || 'User',
            companionName: companion.name,
            amount,
            transactionSignature
          }
        });
        console.log('Purchase confirmation email sent to:', userEmail);
      }
    } catch (emailError) {
      console.error('Error sending purchase email:', emailError);
      // Don't fail the purchase if email fails
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