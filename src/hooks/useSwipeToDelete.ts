import { useState, useRef, useCallback, TouchEvent } from 'react';

interface SwipeToDeleteOptions {
  onDelete: () => void;
  threshold?: number;
}

export const useSwipeToDelete = ({ onDelete, threshold = 100 }: SwipeToDeleteOptions) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow left swipe (negative diff)
    if (diff < 0) {
      setSwipeX(Math.max(diff, -threshold * 1.5));
    }
  }, [isSwiping, threshold]);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
    const diff = currentX.current - startX.current;

    if (Math.abs(diff) >= threshold) {
      // Swipe threshold met - trigger delete
      onDelete();
    }
    
    // Reset position
    setSwipeX(0);
  }, [threshold, onDelete]);

  const reset = useCallback(() => {
    setSwipeX(0);
    setIsSwiping(false);
  }, []);

  return {
    swipeX,
    isSwiping,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
  };
};
