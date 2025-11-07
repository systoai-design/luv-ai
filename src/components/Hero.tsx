import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Lock, Rocket } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { useState } from "react";

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleLaunchApp = () => {
    if (user) {
      navigate("/home");
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero">
        <img 
          src={heroBg} 
          alt="Hero background" 
          className="w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
      </div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/30 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm">Wallet-based • E2EE • x402 Payments</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="text-gradient-animated">
              The Future of
            </span>
            <br />
            <span className="text-foreground">
              Connection & Conversation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Meet, chat, and connect through AI and human interactions. Powered by blockchain wallets, 
            micropayments, and end-to-end encryption.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleLaunchApp}
              variant="gradient"
              className="shadow-glow text-lg px-8"
            >
              <Rocket className="mr-2 h-5 w-5" />
              LAUNCH APP
            </Button>
            <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10 text-lg px-8">
              Learn More
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-16">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all">
              <div className="p-3 rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Instant Micropayments</h3>
              <p className="text-sm text-muted-foreground">Pay per message or by time with x402 protocol</p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-secondary/50 transition-all">
              <div className="p-3 rounded-full bg-secondary/10">
                <Lock className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg">End-to-End Encrypted</h3>
              <p className="text-sm text-muted-foreground">Your conversations stay private, always</p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-accent/50 transition-all">
              <div className="p-3 rounded-full bg-accent/10">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">Verified Identities</h3>
              <p className="text-sm text-muted-foreground">KYC verification with red checkmark badges</p>
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={() => navigate("/home")}
      />
    </section>
  );
};

export default Hero;
