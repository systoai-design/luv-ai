import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Search, MessageCircle, Shield } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Connect Your Wallet",
    description: "No email required. Connect with Phantom or any Solana wallet to get started instantly.",
    color: "primary",
  },
  {
    icon: Search,
    title: "Discover & Match",
    description: "Browse AI bots and verified humans. Swipe on dating profiles or explore the marketplace.",
    color: "secondary",
  },
  {
    icon: MessageCircle,
    title: "Start Chatting",
    description: "Pay per message for AI or book timed sessions with humans. All chats are E2EE encrypted.",
    color: "accent",
  },
  {
    icon: Shield,
    title: "Get Verified",
    description: "Complete KYC verification to earn your red checkmark badge and unlock premium features.",
    color: "verified",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-gradient-to-b from-background/50 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              It Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Get started in minutes with wallet-based authentication
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="bg-card border-border hover:border-primary/50 transition-all shadow-card relative overflow-hidden group"
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
