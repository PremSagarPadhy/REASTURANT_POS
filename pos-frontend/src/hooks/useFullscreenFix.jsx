import { useEffect } from 'react';

export default function useFullscreenFix() {
  useEffect(() => {
    // Function to handle fullscreen changes
    const handleFullscreenChange = () => {
      // Get all motion divs
      const motionElements = document.querySelectorAll('.motion-div');
      
      // Disable all animations temporarily
      motionElements.forEach(el => {
        el.style.transition = 'none';
        el.style.animation = 'none';
      });
      
      // Re-enable animations after a short delay
      setTimeout(() => {
        motionElements.forEach(el => {
          el.style.transition = '';
          el.style.animation = '';
        });
      }, 300);
    };

    // Add event listeners for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
}