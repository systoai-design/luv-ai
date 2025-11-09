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
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [thresholdCrossed, setThresholdCrossed] = useState(false);
  
  // Use refs for values that change frequently to avoid re-renders
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const velocityRef = useRef(0);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const lastMoveTime = useRef(Date.now());
  const lastPosition = useRef(0);
  const rafId = useRef<number>();

  const updateCardTransform = useCallback((x: number, y: number, immediate = false) => {
    if (!cardRef.current) return;
    
    const rotation = (x / 12) * -1; // Slightly more rotation
    const scale = Math.max(0.95, 1 - Math.abs(x) / 2000);
    const opacity = Math.max(0.8, 1 - Math.abs(x) / 500); // Better opacity curve
    
    // Add slight lift effect during drag
    const lift = Math.min(Math.abs(x) / 30, 10);
    
    cardRef.current.style.transform = `translate3d(${x}px, ${y - lift}px, 0) rotate(${rotation}deg) scale(${scale})`;
    cardRef.current.style.opacity = `${opacity}`;
    
    if (immediate) {
      cardRef.current.style.transition = 'none';
    }
  }, []);

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
    positionRef.current = { x: 0, y: 0 };
    lastPosition.current = 0;
    velocityRef.current = 0;
    triggerHaptic('light');
    playSound('tap');
  }, [isAnimating]);

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    if (!isDragging || isAnimating) return;
    
    // Cancel any pending RAF
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      const currentPos = getEventPosition(e);
      const deltaX = currentPos.x - startPos.current.x;
      const deltaY = currentPos.y - startPos.current.y;
      
      // Calculate velocity for momentum
      const now = Date.now();
      const dt = now - lastMoveTime.current;
      if (dt > 0) {
        const vel = (deltaX - lastPosition.current) / dt;
        velocityRef.current = vel;
      }
      lastMoveTime.current = now;
      lastPosition.current = deltaX;
      
      positionRef.current = { x: deltaX, y: deltaY };
      updateCardTransform(deltaX, deltaY, true);
      
      // Trigger haptic and sound when crossing threshold for the first time
      if (!thresholdCrossed && Math.abs(deltaX) > threshold) {
        setThresholdCrossed(true);
        triggerHaptic('medium');
        playSound('threshold');
      }
    });
  }, [isDragging, isAnimating, thresholdCrossed, threshold, updateCardTransform]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isAnimating) return;
    
    setIsDragging(false);
    
    // Cancel any pending RAF
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    const position = positionRef.current;
    const velocity = velocityRef.current;
    
    // Momentum-based swipe detection
    const momentumSwipe = Math.abs(velocity) > 0.5 && Math.abs(position.x) > 50;
    const thresholdSwipe = Math.abs(position.x) > threshold;
    
    if (thresholdSwipe || momentumSwipe) {
      // Valid swipe - animate off screen with velocity-based enhancement
      setIsAnimating(true);
      const direction = position.x > 0 ? 'right' : 'left';
      
      // Velocity-based exit parameters
      const velocityMultiplier = Math.min(Math.abs(velocity) * 2, 3); // Cap at 3x
      const baseDistance = 1000;
      const exitX = (position.x > 0 ? baseDistance : -baseDistance) * (1 + velocityMultiplier * 0.5);
      
      // More dramatic lift for faster swipes
      const baseLift = 50;
      const exitY = position.y - (baseLift + velocityMultiplier * 30);
      
      // Faster swipes = quicker animations
      const baseDuration = 300;
      const exitDuration = Math.max(150, baseDuration - Math.abs(velocity) * 100);
      
      // More rotation for faster swipes
      const baseRotation = exitX / 10;
      const exitRotation = baseRotation * (1 + velocityMultiplier * 0.3) * -1;
      
      // Haptic intensity based on velocity
      triggerHaptic(velocityMultiplier > 1.5 ? 'heavy' : (direction === 'right' ? 'success' : 'medium'));
      playSound(direction === 'right' ? 'like' : 'pass');
      
      if (cardRef.current) {
        // Use different easing for fast vs slow swipes
        const easing = velocityMultiplier > 1 
          ? 'cubic-bezier(0.22, 1, 0.36, 1)' // Faster easing for velocity swipes
          : 'cubic-bezier(0.34, 1.15, 0.64, 1)'; // Elastic for normal swipes
        
        cardRef.current.style.transition = `transform ${exitDuration}ms ${easing}, opacity ${exitDuration}ms ease-out`;
      }
      
      // Apply velocity-enhanced exit transform
      if (cardRef.current) {
        const exitScale = Math.max(0.7, 0.8 - velocityMultiplier * 0.05);
        cardRef.current.style.transform = `translate3d(${exitX}px, ${exitY}px, 0) rotate(${exitRotation}deg) scale(${exitScale})`;
        cardRef.current.style.opacity = '0';
      }
      
      setTimeout(() => {
        onSwipe(direction);
        positionRef.current = { x: 0, y: 0 };
        velocityRef.current = 0;
        if (cardRef.current) {
          cardRef.current.style.transition = '';
        }
        updateCardTransform(0, 0);
        setIsAnimating(false);
      }, exitDuration);
    } else {
      // Enhanced spring back with elastic easing
      triggerHaptic('light');
      playSound('cancel');
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 400ms cubic-bezier(0.25, 1.2, 0.4, 1), opacity 300ms ease-out';
      }
      updateCardTransform(0, 0);
      positionRef.current = { x: 0, y: 0 };
      velocityRef.current = 0;
      
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = '';
        }
      }, 400);
    }
  }, [isDragging, isAnimating, threshold, onSwipe, updateCardTransform]);

  const animateSwipe = useCallback((direction: 'left' | 'right', forcedVelocity?: number) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Use forced velocity for programmatic swipes or default to medium velocity
    const velocity = forcedVelocity ?? 1.5;
    const velocityMultiplier = Math.min(velocity * 2, 3);
    
    const baseDistance = 1000;
    const exitX = (direction === 'right' ? baseDistance : -baseDistance) * (1 + velocityMultiplier * 0.5);
    const exitY = -(50 + velocityMultiplier * 30);
    
    const baseDuration = 300;
    const exitDuration = Math.max(150, baseDuration - velocity * 100);
    
    const baseRotation = exitX / 10;
    const exitRotation = baseRotation * (1 + velocityMultiplier * 0.3) * -1;
    
    // Haptic and sound feedback for programmatic swipe
    triggerHaptic(velocityMultiplier > 1.5 ? 'heavy' : (direction === 'right' ? 'success' : 'medium'));
    playSound(direction === 'right' ? 'like' : 'pass');
    
    if (cardRef.current) {
      const easing = velocityMultiplier > 1 
        ? 'cubic-bezier(0.22, 1, 0.36, 1)'
        : 'cubic-bezier(0.34, 1.15, 0.64, 1)';
      
      cardRef.current.style.transition = `transform ${exitDuration}ms ${easing}, opacity ${exitDuration}ms ease-out`;
      
      const exitScale = Math.max(0.7, 0.8 - velocityMultiplier * 0.05);
      cardRef.current.style.transform = `translate3d(${exitX}px, ${exitY}px, 0) rotate(${exitRotation}deg) scale(${exitScale})`;
      cardRef.current.style.opacity = '0';
    }
    
    setTimeout(() => {
      onSwipe(direction);
      positionRef.current = { x: 0, y: 0 };
      velocityRef.current = 0;
      if (cardRef.current) {
        cardRef.current.style.transition = '';
      }
      updateCardTransform(0, 0);
      setIsAnimating(false);
    }, exitDuration);
  }, [isAnimating, onSwipe, updateCardTransform]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

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
    position: positionRef.current,
    isDragging,
    isAnimating,
    handleStart,
    animateSwipe,
    cardRef,
  };
};
