import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';

interface Position {
  x: number;
  y: number;
}

interface UseCardSwipeProps {
  onSwipe: (direction: 'left' | 'right') => void;
  threshold?: number;
}

export const useCardSwipe = ({ onSwipe, threshold = 150 }: UseCardSwipeProps) => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [thresholdCrossed, setThresholdCrossed] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const lastMoveTime = useRef(Date.now());
  const lastPosition = useRef(0);

  // Enhanced transforms with velocity influence
  const scale = Math.max(0.95, 1 - Math.abs(position.x) / 2000);
  const rotation = (position.x / 15) * (1 + Math.abs(velocity) / 100) * -1;
  const opacity = Math.max(0.7, 1 - Math.abs(position.x) / 600);

  const getEventPosition = (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent): Position => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (isAnimating) return;
    setIsDragging(true);
    setThresholdCrossed(false);
    const pos = getEventPosition(e);
    startPos.current = pos;
    triggerHaptic('light');
    playSound('tap');
  }, [isAnimating]);

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    if (!isDragging || isAnimating) return;
    
    const currentPos = getEventPosition(e);
    const deltaX = currentPos.x - startPos.current.x;
    const deltaY = currentPos.y - startPos.current.y;
    
    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastMoveTime.current;
    if (dt > 0) {
      const vel = (deltaX - lastPosition.current) / dt;
      setVelocity(vel);
    }
    lastMoveTime.current = now;
    lastPosition.current = deltaX;
    
    setPosition({ x: deltaX, y: deltaY });
    
    // Trigger haptic and sound when crossing threshold for the first time
    if (!thresholdCrossed && Math.abs(deltaX) > threshold) {
      setThresholdCrossed(true);
      triggerHaptic('medium');
      playSound('threshold');
    }
  }, [isDragging, isAnimating, thresholdCrossed, threshold]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isAnimating) return;
    
    setIsDragging(false);
    
    // Momentum-based swipe detection
    const momentumSwipe = Math.abs(velocity) > 0.5 && Math.abs(position.x) > 50;
    const thresholdSwipe = Math.abs(position.x) > threshold;
    
    if (thresholdSwipe || momentumSwipe) {
      // Valid swipe - animate off screen with velocity-based duration
      setIsAnimating(true);
      const direction = position.x > 0 ? 'right' : 'left';
      const exitX = position.x > 0 ? 600 : -600;
      const exitDuration = Math.max(150, 250 - Math.abs(velocity) * 50);
      
      // Haptic and sound feedback for valid swipe
      triggerHaptic(direction === 'right' ? 'success' : 'medium');
      playSound(direction === 'right' ? 'like' : 'pass');
      
      setPosition({ x: exitX, y: position.y });
      
      setTimeout(() => {
        onSwipe(direction);
        setPosition({ x: 0, y: 0 });
        setVelocity(0);
        setIsAnimating(false);
      }, exitDuration);
    } else {
      // Spring back to center - light haptic and sound for cancelled swipe
      triggerHaptic('light');
      playSound('cancel');
      setPosition({ x: 0, y: 0 });
      setVelocity(0);
    }
  }, [isDragging, isAnimating, position, velocity, threshold, onSwipe]);

  const animateSwipe = useCallback((direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const exitX = direction === 'right' ? 600 : -600;
    
    // Haptic and sound feedback for programmatic swipe
    triggerHaptic(direction === 'right' ? 'success' : 'medium');
    playSound(direction === 'right' ? 'like' : 'pass');
    
    setPosition({ x: exitX, y: 0 });
    
    setTimeout(() => {
      onSwipe(direction);
      setPosition({ x: 0, y: 0 });
      setVelocity(0);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating, onSwipe]);

  // Prevent body scroll during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging]);

  // Add global mouse/touch listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      handleMove(e);
    };

    const handleGlobalEnd = () => {
      handleEnd();
    };

    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return {
    position,
    rotation,
    opacity,
    scale,
    velocity,
    isDragging,
    isAnimating,
    handleStart,
    animateSwipe,
    cardRef,
  };
};
