
import React from 'react';

interface MapHeaderProps {
  imageUrl: string | null;
  loading: boolean;
  locationName: string;
}

export const MapHeader: React.FC<MapHeaderProps> = ({ imageUrl, loading, locationName }) => {
  if (!imageUrl && !loading) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      {loading ? (
        <div className="w-full h-48 md:h-64 bg-stone-100 animate-pulse rounded-sm flex flex-col items-center justify-center border border-stone-200">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="font-serif text-stone-400 italic text-sm">Consulting ancient maps...</span>
        </div>
      ) : imageUrl ? (
        <div className="relative w-full rounded-sm shadow-md border border-stone-200 overflow-hidden group">
          <div className="aspect-[21/9] w-full bg-[#E6E4DE]">
             <img 
               src={imageUrl} 
               alt={`Ancient map of ${locationName}`} 
               className="w-full h-full object-cover opacity-90 mix-blend-multiply sepia-[0.15] contrast-110"
             />
             {/* Overlay texture */}
             <div className="absolute inset-0 bg-amber-100/10 mix-blend-overlay pointer-events-none"></div>
             <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(44,44,44,0.1)] pointer-events-none"></div>
          </div>
          
          {/* Caption */}
          <div className="absolute bottom-0 right-0 bg-white/90 px-3 py-1 border-t border-l border-stone-200 shadow-sm">
            <p className="font-sans text-[10px] uppercase tracking-widest text-clay">
              <span className="text-gold mr-1">📍</span>
              {locationName}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
