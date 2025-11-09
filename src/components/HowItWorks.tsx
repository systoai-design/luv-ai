import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Search, MessageCircle, Shield } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Wallet,
    title: "Connect Your Wallet",
    description: "No email required. Connect with Phantom or Solflare wallet to sign in securely with your Solana address.",
    color: "primary",
  },
  {
    icon: Search,
    title: "Choose Your Companion",
    description: "Browse 6 unique AI companions, each with distinct personalities. View their traits, ratings, and taglines.",
    color: "secondary",
  },
  {
    icon: Shield,
    title: "Purchase Access On-Chain",
    description: "Buy lifetime access via x402 micropayments. Verified on-chain for instant, trustless access control.",
    color: "accent",
  },
  {
    icon: MessageCircle,
    title: "Chat Privately (30 msgs/day)",
    description: "All conversations are end-to-end encrypted. Enjoy 30 messages per day per companion (resets daily at 00:00 UTC).",
    color: "verified",
  },
];

const HowItWorks = () => {
  const { elementRef, isVisible } = useScrollAnimation();

  return (
    <section 
      id="how-it-works" 
      ref={elementRef as React.RefObject<HTMLElement>}
      className={cn(
        "py-24 px-4 bg-gradient-to-b from-background/50 to-background transition-all duration-1000",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <div className="container mx-auto max-w-6xl">
        <div 
          className={cn(
            "text-center mb-16 transition-all duration-700 delay-150",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How{" "}
            <span className="text-gradient-pulse">
              It Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Get started in minutes with wallet-based authentication and on-chain access
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className={cn(
                  "bg-card border-border hover:border-primary/50 transition-all shadow-card relative overflow-hidden group card-gradient-hover",
                  isVisible && "animate-fade-in"
                )}
                style={{
                  animationDelay: isVisible ? `${index * 150 + 300}ms` : '0ms',
                  animationFillMode: 'both'
                }}
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-${step.color}`} />
                <CardContent className="pt-8 pb-6 px-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-full bg-${step.color}/10`}>
                      <Icon className={`h-6 w-6 text-${step.color}`} />
                    </div>
                    <span className="text-3xl font-bold text-muted-foreground/20">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
