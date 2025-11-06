import { Button } from "@/components/ui/button";
import { Wallet, Heart, MessageCircle, Sparkles } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Heart className="h-8 w-8 text-primary fill-primary animate-glow" />
            <Sparkles className="h-4 w-4 text-secondary absolute -top-1 -right-1" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            LUVAI
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#discover" className="text-foreground/80 hover:text-foreground transition-colors">
            Discover
          </a>
          <a href="#marketplace" className="text-foreground/80 hover:text-foreground transition-colors">
            Marketplace
          </a>
          <a href="#how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">
            How It Works
          </a>
        </nav>

        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow">
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </div>
    </header>
  );
};

export default Header;
