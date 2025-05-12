import React from 'react';

const Spinner = () => {
  return (
    <div className="inline-block">
      <div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;