
import React from 'react';

interface StudyMapProps {
  imageUrl: string | null;
  loading: boolean;
  locationName: string;
}

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.159.69.159 1.006 0Z" />
  </svg>
);

export const StudyMap: React.FC<StudyMapProps> = ({ imageUrl, loading, locationName }) => {
  if (!imageUrl && !loading) return null;

  return (
    <section className="animate-fade-in-up pt-8">
       <div className="flex items-center gap-3 mb-6 border-b border-gold/30 pb-2 inline-block">
         <span className="text-gold"><MapIcon /></span>
         <h2 className="font-display text-2xl text-ink">Historical Geography</h2>
       </div>

       <div className="w-full bg-surface p-4 rounded-sm border border-stone shadow-sm">
          {loading ? (
            <div className="w-full aspect-[21/9] bg-paper animate-pulse rounded-sm flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="font-serif text-stone italic text-sm">Drafting map of {locationName}...</span>
            </div>
          ) : imageUrl ? (
            <div className="relative w-full rounded-sm overflow-hidden group">
               <div className="aspect-[21/9] w-full bg-stone">
                 <img 
                   src={imageUrl} 
                   alt={`Historical map of ${locationName}`} 
                   className="w-full h-full object-cover sepia-[0.05] contrast-105"
                 />
               </div>
               <div className="flex items-center justify-between mt-3 px-1">
                 <p className="text-xs font-sans text-stone uppercase tracking-wider">
                   {locationName}
                 </p>
                 <p className="text-[10px] font-serif text-stone italic">
                   Historical Approximation
                 </p>
               </div>
            </div>
          ) : null}
       </div>
    </section>
  );
};
