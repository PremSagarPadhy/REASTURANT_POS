import React from 'react';

const Spinner = ({ size = "md" }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-5 h-5';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      case 'md':
      default:
        return 'w-8 h-8';
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${getSizeClass()} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
    </div>
  );
};

export default Spinner;