import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export const useLongPress = ({
  onLongPress,
  onClick,
  delay = 500,
}: UseLongPressOptions) => {
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      target.current = event.target;
      timeout.current = setTimeout(() => {
        onLongPress();
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      if (shouldTriggerClick && onClick && target.current === event.target) {
        onClick();
      }
    },
    [onClick]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
};
