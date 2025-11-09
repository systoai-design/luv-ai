import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/Hero";
import DiscoverSection from "@/components/DiscoverSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import ChatDemo from "@/components/ChatDemo";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/landing/ThemeToggle";
import StatsSection from "@/components/landing/StatsSection";
import { AuthModal } from "@/components/auth/AuthModal";

const Index = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pathname = location.pathname;
    if ((params.get('showAuth') === 'true' || pathname === '/auth') && !user) {
      setAuthModalOpen(true);
    }
  }, [location, user]);

  const handleOpenAuthModal = () => {
    if (user) {
      navigate("/home");
      return;
    }
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <LandingHeader onOpenAuthModal={handleOpenAuthModal} />
      <Hero onOpenAuthModal={handleOpenAuthModal} />
      <StatsSection />
      <DiscoverSection />
      <ChatDemo />
      <MarketplaceSection />
      <HowItWorks />
      <Footer />
      <ThemeToggle />
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
