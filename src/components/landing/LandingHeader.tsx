import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import logo from "@/assets/logo.svg";
import twitterLogo from "@/assets/twitter-x-logo.png";
import pumpfunLogo from "@/assets/pumpfun-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LandingHeaderProps {
  onOpenAuthModal: () => void;
}

const LandingHeader = ({ onOpenAuthModal }: LandingHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const activeSection = useActiveSection(["discover", "marketplace", "how-it-works"]);
  const [clickedSection, setClickedSection] = useState<string | null>(null);

  const handleLaunchApp = () => {
    if (user) {
      navigate("/home");
    } else {
      onOpenAuthModal();
    }
  };

  const handleNavClick = (sectionId: string) => {
    setClickedSection(sectionId);
    smoothScrollTo(sectionId);
    setTimeout(() => setClickedSection(null), 150);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src={logo} alt="LUVAI" className="h-12 w-auto" />
        </a>
        
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => handleNavClick("discover")}
            className={cn(
              "text-foreground/80 hover:text-foreground transition-all relative",
              activeSection === "discover" && "text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary",
              clickedSection === "discover" && "scale-95"
            )}
          >
            Find Matches
          </button>
          <button
            onClick={() => handleNavClick("marketplace")}
            className={cn(
              "text-foreground/80 hover:text-foreground transition-all relative",
              activeSection === "marketplace" && "text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary",
              clickedSection === "marketplace" && "scale-95"
            )}
          >
            AI Companions
          </button>
          <button
            onClick={() => handleNavClick("how-it-works")}
            className={cn(
              "text-foreground/80 hover:text-foreground transition-all relative",
              activeSection === "how-it-works" && "text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary",
              clickedSection === "how-it-works" && "scale-95"
            )}
          >
            How It Works
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {/* Social Media Icons */}
          <a 
            href="https://x.com/LuvloveAI" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent/10 transition-colors"
          >
            <img src={twitterLogo} alt="Twitter" className="h-5 w-5 object-contain" />
          </a>
          <a 
            href="https://pump.fun/YourProject" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent/10 transition-colors"
          >
            <img src={pumpfunLogo} alt="Pump.fun" className="h-5 w-5 object-contain" />
          </a>

          <Button
            onClick={handleLaunchApp}
            size="lg"
            variant="gradient"
            className="shadow-glow"
          >
            <Rocket className="h-5 w-5 mr-2" />
            LAUNCH APP
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
