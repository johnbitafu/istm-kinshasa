import React from 'react';

const ScrollingBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-green-600/20"></div>
      
      {/* Floating medical icons */}
      <div className="absolute inset-0">
        <div className="animate-float-slow absolute top-20 left-10">
          <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V6a1 1 0 112 0v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="animate-float-medium absolute top-40 right-20">
          <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="animate-float-fast absolute bottom-32 left-1/4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="animate-float-slow absolute top-60 right-1/3">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="animate-float-medium absolute bottom-20 right-10">
          <div className="w-18 h-18 bg-blue-50 rounded-full flex items-center justify-center">
            <svg className="w-9 h-9 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Animated gradient waves */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-100/30 to-transparent animate-wave"></div>
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-green-100/20 to-transparent animate-wave-reverse"></div>
    </div>
  );
};

export default ScrollingBackground;