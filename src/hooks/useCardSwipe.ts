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
      // Valid swipe - animate off screen with enhanced exit
      setIsAnimating(true);
      const direction = position.x > 0 ? 'right' : 'left';
      const exitX = position.x > 0 ? 1000 : -1000;
      const exitY = position.y - 50; // Lift up as it exits
      const exitDuration = Math.max(200, 300 - Math.abs(velocity) * 50);
      
      // Haptic and sound feedback for valid swipe
      triggerHaptic(direction === 'right' ? 'success' : 'medium');
      playSound(direction === 'right' ? 'like' : 'pass');
      
      if (cardRef.current) {
        // Enhanced exit with more dramatic rotation and lift
        cardRef.current.style.transition = `transform ${exitDuration}ms cubic-bezier(0.34, 1.15, 0.64, 1), opacity ${exitDuration}ms ease-out`;
      }
      
      // Apply exit transform with increased rotation
      const exitRotation = (exitX / 10) * -1;
      if (cardRef.current) {
        cardRef.current.style.transform = `translate3d(${exitX}px, ${exitY}px, 0) rotate(${exitRotation}deg) scale(0.8)`;
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

  const animateSwipe = useCallback((direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const exitX = direction === 'right' ? 1000 : -1000;
    const exitY = -50; // Lift up as it exits
    
    // Haptic and sound feedback for programmatic swipe
    triggerHaptic(direction === 'right' ? 'success' : 'medium');
    playSound(direction === 'right' ? 'like' : 'pass');
    
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 300ms cubic-bezier(0.34, 1.15, 0.64, 1), opacity 300ms ease-out';
      
      const exitRotation = (exitX / 10) * -1;
      cardRef.current.style.transform = `translate3d(${exitX}px, ${exitY}px, 0) rotate(${exitRotation}deg) scale(0.8)`;
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
    }, 300);
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
