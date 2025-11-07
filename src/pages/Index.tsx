import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/Hero";
import DiscoverSection from "@/components/DiscoverSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import ChatDemo from "@/components/ChatDemo";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <LandingHeader />
      <Hero />
      <DiscoverSection />
      <MarketplaceSection />
      <ChatDemo />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
