import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      
      // Check for modifier key (Cmd on Mac, Ctrl on Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (!modifier) return;
      
      const shortcuts: Record<string, { path: string; name: string }> = {
        'h': { path: '/home', name: 'Home' },
        'm': { path: '/messages', name: 'Messages' },
        'c': { path: '/connections', name: 'Connections' },
        'k': { path: '/marketplace', name: 'Marketplace' },
        'n': { path: '/notifications', name: 'Notifications' },
        'p': { path: '/profile', name: 'Profile' },
      };
      
      const shortcut = shortcuts[e.key.toLowerCase()];
      if (shortcut) {
        e.preventDefault();
        navigate(shortcut.path);
        toast.success(`📍 ${shortcut.name}`, {
          duration: 1500,
        });
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
};
