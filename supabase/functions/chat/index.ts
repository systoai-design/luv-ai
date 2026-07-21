import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The AI chat backend has been removed (previously routed through a third-party
// AI gateway). To restore chat, wire up a provider here:
//   1. Authenticate the request via supabase.auth.getUser(token).
//   2. Enforce the daily limit with the `check_daily_chat_limit` RPC.
//   3. Load the companion's personality (ai_companions) and recent history
//      (chat_messages) to build the system prompt + messages array.
//   4. Call the provider's chat/completions endpoint with stream: true and
//      return response.body as `text/event-stream`.
// The prior implementation is available in git history for reference.

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  return new Response(
    JSON.stringify({
      error:
        "AI chat is temporarily unavailable while we connect a new AI provider. Please check back soon.",
    }),
    {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
