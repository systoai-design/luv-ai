/**
 * Haptic feedback utility for mobile devices
 * Provides tactile feedback using the Vibration API
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

/**
 * Trigger haptic feedback vibration
 * @param type - The type of haptic feedback
 */
export const triggerHaptic = (type: HapticType): void => {
  // Check if Vibration API is supported
  if (!('vibrate' in navigator)) return;
  
  const patterns: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    error: [50, 50, 50]
  };
  
  try {
    navigator.vibrate(patterns[type]);
  } catch (error) {
    // Silently fail if vibration is not supported or blocked
    console.debug('Haptic feedback not available:', error);
  }
};
