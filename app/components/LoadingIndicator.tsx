import React from 'react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-2 border-stone-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-t-2 border-gold rounded-full animate-spin"></div>
      </div>
      <p className="font-serif text-clay italic animate-pulse">Consulting the archives...</p>
    </div>
  );
};