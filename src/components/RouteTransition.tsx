import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface RouteTransitionProps {
  children: React.ReactNode;
}

export const RouteTransition = ({ children }: RouteTransitionProps) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"fade-in" | "fade-out">("fade-in");

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage("fade-out");
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === "fade-out") {
      setDisplayLocation(location);
      setTransitionStage("fade-in");
    }
  };

  return (
    <div
      className={`w-full h-full ${
        transitionStage === "fade-in" ? "animate-fade-in" : "animate-fade-out"
      }`}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
};
