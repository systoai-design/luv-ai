import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { chatId, message, companionId, mediaUrl, mediaType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side check of daily chat limit
    const { data: limitCheck, error: limitError } = await supabase.rpc(
      'check_daily_chat_limit',
      { p_user_id: user.id }
    );

    if (limitError) {
      console.error('Error checking chat limit:', limitError);
      return new Response(JSON.stringify({ error: "Failed to check message limit" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!limitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: `Daily limit reached. You've used all ${limitCheck.limit} messages today. Limit resets at midnight UTC.` 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Chat limit check passed. User ${user.id} has ${limitCheck.remaining} messages remaining.`);

    // Get companion details for system prompt - use actual schema columns
    const { data: companion } = await supabase
      .from('ai_companions')
      .select('name, system_prompt, voice_tone, romance, lust, loyalty, humor, intelligence, empathy, playfulness, dominance')
      .eq('id', companionId)
      .single();

    if (!companion) throw new Error("Companion not found");

    // Get chat history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender_type, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build system prompt with personality traits
    const traits = `Personality traits — romance:${companion.romance}, humor:${companion.humor}, intelligence:${companion.intelligence}, empathy:${companion.empathy}, playfulness:${companion.playfulness}, dominance:${companion.dominance}, loyalty:${companion.loyalty}, lust:${companion.lust}. Voice tone: ${companion.voice_tone || 'friendly'}.`;
    const systemPrompt = companion.system_prompt || `You are ${companion.name}. Be ${companion.voice_tone || 'friendly'}. ${traits}`;

    // Build context with media awareness
    let userMessageContent = message;
    if (mediaUrl && mediaType) {
      userMessageContent = `[User sent a ${mediaType}] ${message || ''}`.trim();
    }

    const messages = [
      { 
        role: "system", 
        content: systemPrompt
      },
      ...(history || []).map(msg => ({
        role: msg.sender_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: userMessageContent }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
