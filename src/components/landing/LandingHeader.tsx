import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { useState } from "react";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";

const LandingHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const activeSection = useActiveSection(["discover", "marketplace", "how-it-works"]);

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
          <button
            onClick={() => smoothScrollTo("discover")}
            className={cn(
              "text-foreground/80 hover:text-foreground transition-colors relative",
              activeSection === "discover" && "text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            Discover
          </button>
          <button
            onClick={() => smoothScrollTo("marketplace")}
            className={cn(
              "text-foreground/80 hover:text-foreground transition-colors relative",
              activeSection === "marketplace" && "text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            Marketplace
          </button>
          <button
            onClick={() => smoothScrollTo("how-it-works")}
            className={cn(
              "text-foreground/80 hover:text-foreground transition-colors relative",
              activeSection === "how-it-works" && "text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            How It Works
          </button>
        </nav>

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
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={() => navigate("/home")}
      />
    </header>
  );
};

export default LandingHeader;
