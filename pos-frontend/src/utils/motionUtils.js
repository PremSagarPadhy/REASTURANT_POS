// Optimized motion variants for faster transitions
export const optimizedTransitions = {
  // For page transitions
  page: {
    initial: { opacity: 0.95 },
    animate: { opacity: 1 },
    exit: { opacity: 0.95 },
    transition: { duration: 0.1 }
  },
  
  // For container elements
  container: {
    initial: { opacity: 0.9 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.15,
        when: "beforeChildren",
        staggerChildren: 0.02 
      }
    },
    exit: { 
      opacity: 0.9,
      transition: { duration: 0.1 } 
    }
  },
  
  // For list items and cards
  item: {
    initial: { opacity: 0.9 },
    animate: { opacity: 1 },
    exit: { opacity: 0.9 },
    transition: { duration: 0.1 }
  }
};