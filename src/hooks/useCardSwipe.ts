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
    
    const rotation = (x / 15) * -1;
    const scale = Math.max(0.95, 1 - Math.abs(x) / 2000);
    const opacity = Math.max(0.7, 1 - Math.abs(x) / 600);
    
    cardRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
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
      // Valid swipe - animate off screen
      setIsAnimating(true);
      const direction = position.x > 0 ? 'right' : 'left';
      const exitX = position.x > 0 ? 800 : -800;
      const exitDuration = Math.max(150, 250 - Math.abs(velocity) * 50);
      
      // Haptic and sound feedback for valid swipe
      triggerHaptic(direction === 'right' ? 'success' : 'medium');
      playSound(direction === 'right' ? 'like' : 'pass');
      
      if (cardRef.current) {
        cardRef.current.style.transition = `transform ${exitDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${exitDuration}ms ease-out`;
      }
      updateCardTransform(exitX, position.y);
      
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
      // Spring back to center
      triggerHaptic('light');
      playSound('cancel');
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out';
      }
      updateCardTransform(0, 0);
      positionRef.current = { x: 0, y: 0 };
      velocityRef.current = 0;
      
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = '';
        }
      }, 300);
    }
  }, [isDragging, isAnimating, threshold, onSwipe, updateCardTransform]);

  const animateSwipe = useCallback((direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const exitX = direction === 'right' ? 800 : -800;
    
    // Haptic and sound feedback for programmatic swipe
    triggerHaptic(direction === 'right' ? 'success' : 'medium');
    playSound(direction === 'right' ? 'like' : 'pass');
    
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 250ms ease-out';
    }
    updateCardTransform(exitX, 0);
    
    setTimeout(() => {
      onSwipe(direction);
      positionRef.current = { x: 0, y: 0 };
      velocityRef.current = 0;
      if (cardRef.current) {
        cardRef.current.style.transition = '';
      }
      updateCardTransform(0, 0);
      setIsAnimating(false);
    }, 250);
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
