import { useEffect } from 'react';
import { enterFullscreen, exitFullscreen } from '../utils/fullscreenUtils';

export default function useF11Handler() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11' || e.keyCode === 122) {
        e.preventDefault();
        
        // Check if we're currently in fullscreen mode
        if (!document.fullscreenElement) {
          enterFullscreen(document.documentElement);
        } else {
          exitFullscreen();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}