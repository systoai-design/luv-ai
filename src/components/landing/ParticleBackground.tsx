import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Sparkles, Star } from "lucide-react";

interface Particle {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  icon: number;
  duration: number;
  delay: number;
}

const icons = [Heart, MessageCircle, Sparkles, Star];

const ParticleBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 15 : 25;
    
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      baseX: Math.random() * 100,
      baseY: Math.random() * 100,
      size: Math.random() * 20 + 20,
      icon: Math.floor(Math.random() * icons.length),
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
    
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    let rafId: number;
    let lastTime = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < 16) return; // Throttle to ~60fps
      lastTime = now;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    const throttledMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => handleMouseMove(e));
    };

    window.addEventListener("mousemove", throttledMove);
    return () => {
      window.removeEventListener("mousemove", throttledMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const getParticleOffset = (particle: Particle) => {
    const dx = mousePos.x - particle.x;
    const dy = mousePos.y - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 20;

    if (distance < maxDistance) {
      const force = (maxDistance - distance) / maxDistance;
      return {
        x: -dx * force * 0.5,
        y: -dy * force * 0.5,
      };
    }
    return { x: 0, y: 0 };
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {particles.map((particle) => {
        const Icon = icons[particle.icon];
        const offset = getParticleOffset(particle);
        
        return (
          <div
            key={particle.id}
            className="absolute opacity-30 will-change-transform"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: `translate(${offset.x}%, ${offset.y}%) translate(-50%, -50%)`,
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          >
            <Icon className="w-full h-full text-primary" />
          </div>
        );
      })}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(20px) rotate(-5deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ParticleBackground;
