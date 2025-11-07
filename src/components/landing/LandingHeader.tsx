import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { useState } from "react";

const LandingHeader = () => {
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src={logo} alt="LUVAI" className="h-12 w-auto" />
        </a>
        
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

        <Button
          onClick={handleLaunchApp}
          size="lg"
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
        >
          <Rocket className="h-5 w-5 mr-2" />
          LAUNCH APP
        </Button>
      </div>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={() => navigate("/home")}
      />
    </header>
  );
};

export default LandingHeader;
