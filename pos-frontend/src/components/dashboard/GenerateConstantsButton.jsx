import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const GenerateConstantsButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateConstants = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const response = await axios.get('http://localhost:5000/api/category/generate-constants');
      
      if (response.status === 200) {
        toast.success('Constants file generated successfully!');
        toast.success('Please restart your development server to see changes');
      }
    } catch (error) {
      console.error('Error generating constants file:', error);
      toast.error('Failed to generate constants file. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerateConstants}
      disabled={isGenerating}
      className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
    >
      {isGenerating ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span>Generate Constants File</span>
        </>
      )}
    </button>
  );
};

export default GenerateConstantsButton;