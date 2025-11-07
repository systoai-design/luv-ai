import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseEmailRequest {
  userEmail: string;
  userName: string;
  companionName: string;
  amount: number;
  transactionSignature: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, companionName, amount, transactionSignature }: PurchaseEmailRequest = await req.json();

    console.log('Sending purchase confirmation email to:', userEmail);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AI Companions <onboarding@resend.dev>',
        to: [userEmail],
        subject: `Access Granted: ${companionName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .detail-row:last-child { border-bottom: none; }
                .label { color: #6b7280; font-weight: 500; }
                .value { color: #111827; font-weight: 600; }
                .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                .transaction { font-family: monospace; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">🎉 Access Granted!</h1>
                </div>
                <div class="content">
                  <p>Hi ${userName},</p>
                  <p>Congratulations! You now have lifetime access to chat with <strong>${companionName}</strong>.</p>
                  
                  <div class="detail-box">
                    <h2 style="margin-top: 0; color: #667eea; font-size: 18px;">Purchase Details</h2>
                    <div class="detail-row">
                      <span class="label">Companion:</span>
                      <span class="value">${companionName}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Amount Paid:</span>
                      <span class="value">${amount} SOL</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Access Type:</span>
                      <span class="value">Lifetime</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Messages:</span>
                      <span class="value">Unlimited</span>
                    </div>
                  </div>

                  <div class="detail-box">
                    <h3 style="margin-top: 0; color: #667eea; font-size: 16px;">Transaction ID</h3>
                    <div class="transaction">${transactionSignature}</div>
                  </div>

                  <p style="margin-top: 30px;">Start chatting now and enjoy unlimited conversations with your AI companion!</p>
                </div>
                
                <div class="footer">
                  <p>Thank you for your purchase!</p>
                  <p>If you have any questions, please don't hesitate to reach out.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-purchase-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
