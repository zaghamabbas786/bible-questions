
import React from 'react';
import { LocationImage } from '@/types';

interface LocationPhotosProps {
  locations: LocationImage[];
}

const PinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

export const LocationPhotos: React.FC<LocationPhotosProps> = ({ locations }) => {
  if (!locations || locations.length === 0) return null;

  return (
    <section className="animate-fade-in-up">
       <div className="flex items-center gap-3 mb-6 border-b border-gold/30 pb-2 inline-block">
         <span className="text-gold"><PinIcon /></span>
         <h2 className="font-display text-2xl text-ink">Biblical Locations</h2>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {locations.map((loc, index) => (
           <div 
             key={index} 
             className="bg-white p-4 rounded-sm border border-stone-200 shadow-sm"
           >
             <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100 mb-4 relative rounded-sm">
                <img 
                  src={loc.imageUrl} 
                  alt={loc.name} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
             </div>
             <div className="flex items-center justify-between px-2">
               <h3 className="font-serif text-lg text-ink font-medium italic">
                 {loc.name}
               </h3>
               <span className="text-xs font-sans text-stone-400 uppercase tracking-wider">Visualization</span>
             </div>
           </div>
         ))}
       </div>
    </section>
  );
};
