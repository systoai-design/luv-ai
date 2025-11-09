import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'heart' | 'star' | 'circle';
  rotation: number;
  rotationSpeed: number;
}

export type ParticleEffect = 'match' | 'superlike' | 'confetti';

export const useParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  const drawHeart = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, size * 0.1, 0, size);
    ctx.bezierCurveTo(size, size * 0.1, size * 0.5, -size * 0.3, 0, size * 0.3);
    ctx.closePath();
    ctx.restore();
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? size : size * 0.4;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.restore();
  };

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter(particle => {
      // Update particle physics
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3; // Gravity
      particle.vx *= 0.99; // Air resistance
      particle.life--;
      particle.rotation += particle.rotationSpeed;

      // Calculate alpha based on life
      const alpha = particle.life / particle.maxLife;
      
      // Set color with alpha
      const [r, g, b] = particle.color.match(/\d+/g)?.map(Number) || [255, 255, 255];
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.lineWidth = 2;

      // Draw particle based on shape
      if (particle.shape === 'heart') {
        drawHeart(ctx, particle.x, particle.y, particle.size, particle.rotation);
        ctx.fill();
        ctx.stroke();
      } else if (particle.shape === 'star') {
        drawStar(ctx, particle.x, particle.y, particle.size, particle.rotation);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      return particle.life > 0;
    });

    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const createParticles = useCallback((
    x: number,
    y: number,
    effect: ParticleEffect,
    intensity: number = 1
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const particles: Particle[] = [];
    const baseCount = effect === 'match' ? 40 : effect === 'superlike' ? 30 : 20;
    const particleCount = Math.floor(baseCount * Math.max(0.5, Math.min(intensity, 3)));

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = effect === 'confetti' 
        ? (2 + Math.random() * 4) * intensity
        : 3 + Math.random() * 5;
      
      const confettiColors = [
        'rgb(239, 68, 68)', 'rgb(59, 130, 246)', 'rgb(34, 197, 94)', 
        'rgb(251, 146, 60)', 'rgb(168, 85, 247)', 'rgb(236, 72, 153)'
      ];
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - (effect === 'confetti' ? 3 : 2),
        life: effect === 'confetti' ? 60 + Math.random() * 30 : 80 + Math.random() * 40,
        maxLife: effect === 'confetti' ? 90 : 120,
        size: effect === 'match' ? 8 + Math.random() * 8 : effect === 'confetti' ? 4 + Math.random() * 6 : 6 + Math.random() * 6,
        color: effect === 'match' 
          ? ['rgb(239, 68, 68)', 'rgb(244, 63, 94)', 'rgb(236, 72, 153)'][Math.floor(Math.random() * 3)]
          : effect === 'superlike'
          ? ['rgb(234, 179, 8)', 'rgb(250, 204, 21)', 'rgb(253, 224, 71)'][Math.floor(Math.random() * 3)]
          : confettiColors[Math.floor(Math.random() * confettiColors.length)],
        shape: effect === 'match' ? 'heart' : effect === 'confetti' ? (Math.random() > 0.5 ? 'circle' : 'star') : 'star',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * (effect === 'confetti' ? 0.3 : 0.2),
      });
    }

    // Add some circle particles for extra sparkle
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 2 + Math.random() * 4;
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 1,
        life: 60 + Math.random() * 30,
        maxLife: 90,
        size: 2 + Math.random() * 4,
        color: 'rgb(255, 255, 255)',
        shape: 'circle',
        rotation: 0,
        rotationSpeed: 0,
      });
    }

    particlesRef.current.push(...particles);

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const trigger = useCallback((effect: ParticleEffect, position?: { x: number; y: number }, intensity: number = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use provided position or default to center
    const x = position?.x ?? canvas.width / 2;
    const y = position?.y ?? canvas.height / 2;
    createParticles(x, y, effect, intensity);
  }, [createParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    canvasRef,
    trigger,
  };
};
