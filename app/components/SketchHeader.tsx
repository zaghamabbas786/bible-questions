
import React from 'react';

interface SketchHeaderProps {
  imageUrl: string | null;
  loading: boolean;
}

export const SketchHeader: React.FC<SketchHeaderProps> = ({ imageUrl, loading }) => {
  if (!imageUrl && !loading) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-12 flex justify-center">
      {loading ? (
        <div className="w-full h-48 md:h-64 bg-stone-100 animate-pulse rounded-sm flex items-center justify-center">
          <span className="font-serif text-stone-300 italic">Sketching...</span>
        </div>
      ) : imageUrl ? (
        <div className="relative w-full overflow-hidden rounded-sm">
          <div className="aspect-[16/9] md:aspect-[21/9] w-full">
             <img 
               src={imageUrl} 
               alt="Biblical sketch" 
               className="w-full h-full object-cover sepia-[.2] opacity-90 mix-blend-multiply"
             />
             {/* Vignette overlay to blend edges into the page */}
             <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_20px_#F9F8F4]"></div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
