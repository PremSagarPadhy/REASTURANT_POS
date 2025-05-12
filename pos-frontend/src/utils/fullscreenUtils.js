/**
 * Utility to handle fullscreen transitions without animation glitches
 */
export const enterFullscreen = (element) => {
  // First disable all animations
  document.body.classList.add('framer-motion-override');
  
  // Request fullscreen
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
  
  // Re-enable animations after transition
  setTimeout(() => {
    document.body.classList.remove('framer-motion-override');
  }, 200);
};

export const exitFullscreen = () => {
  // Disable animations
  document.body.classList.add('framer-motion-override');
  
  // Exit fullscreen
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
  
  // Re-enable animations
  setTimeout(() => {
    document.body.classList.remove('framer-motion-override');
  }, 200);
};