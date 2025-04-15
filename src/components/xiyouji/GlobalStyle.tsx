import React from 'react';

const GlobalStyle: React.FC = () => {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeSlideUp {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
        
        .animate-fadeSlideUp {
          animation: fadeSlideUp 0.5s ease forwards;
        }
      `
    }} />
  );
};

export default GlobalStyle; 