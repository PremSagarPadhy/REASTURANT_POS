import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AnimationContext = createContext({
  animationsEnabled: true,
  enableAnimations: () => {},
  disableAnimations: () => {},
});

export const AnimationProvider = ({ children }) => {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  const enableAnimations = () => setAnimationsEnabled(true);
  const disableAnimations = () => setAnimationsEnabled(false);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        disableAnimations();
        // Re-enable after transition completes
        setTimeout(enableAnimations, 300);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <AnimationContext.Provider value={{ animationsEnabled, enableAnimations, disableAnimations }}>
      {children}
    </AnimationContext.Provider>
  );
};

AnimationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAnimation = () => useContext(AnimationContext);