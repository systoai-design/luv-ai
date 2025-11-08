import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerHaptic } from '@/lib/haptics';

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
  const startPos = useRef<Position>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const rotation = (position.x / 20) * -1;
  const opacity = Math.max(0.5, 1 - Math.abs(position.x) / 400);

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
    triggerHaptic('light'); // Light haptic on drag start
  }, [isAnimating]);

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    if (!isDragging || isAnimating) return;
    
    const currentPos = getEventPosition(e);
    const deltaX = currentPos.x - startPos.current.x;
    const deltaY = currentPos.y - startPos.current.y;
    
    setPosition({ x: deltaX, y: deltaY });
    
    // Trigger haptic when crossing threshold for the first time
    if (!thresholdCrossed && Math.abs(deltaX) > threshold) {
      setThresholdCrossed(true);
      triggerHaptic('medium');
    }
  }, [isDragging, isAnimating, thresholdCrossed, threshold]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isAnimating) return;
    
    setIsDragging(false);
    
    if (Math.abs(position.x) > threshold) {
      // Valid swipe - animate off screen
      setIsAnimating(true);
      const direction = position.x > 0 ? 'right' : 'left';
      const exitX = position.x > 0 ? 600 : -600;
      
      // Haptic feedback for valid swipe
      triggerHaptic(direction === 'right' ? 'success' : 'medium');
      
      setPosition({ x: exitX, y: position.y });
      
      setTimeout(() => {
        onSwipe(direction);
        setPosition({ x: 0, y: 0 });
        setIsAnimating(false);
      }, 300);
    } else {
      // Spring back to center - light haptic for cancelled swipe
      triggerHaptic('light');
      setPosition({ x: 0, y: 0 });
    }
  }, [isDragging, isAnimating, position, threshold, onSwipe]);

  const animateSwipe = useCallback((direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const exitX = direction === 'right' ? 600 : -600;
    
    // Haptic feedback for programmatic swipe
    triggerHaptic(direction === 'right' ? 'success' : 'medium');
    
    setPosition({ x: exitX, y: 0 });
    
    setTimeout(() => {
      onSwipe(direction);
      setPosition({ x: 0, y: 0 });
      setIsAnimating(false);
    }, 300);
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
    isDragging,
    isAnimating,
    handleStart,
    animateSwipe,
    cardRef,
  };
};
