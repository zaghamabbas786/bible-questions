
import React from 'react';
import { MapLocation } from '@/types';

interface MapSectionProps {
  maps: MapLocation[];
}

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

export const MapSection: React.FC<MapSectionProps> = ({ maps }) => {
  if (!maps || maps.length === 0) return null;

  return (
    <section className="animate-fade-in-up">
       <div className="flex items-center gap-3 mb-6 border-b border-gold/30 pb-2 inline-block">
         <span className="text-gold"><MapIcon /></span>
         <h2 className="font-display text-2xl text-ink">Relevant Locations</h2>
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
         {maps.map((map, index) => (
           <a 
             key={index} 
             href={map.uri} 
             target="_blank" 
             rel="noopener noreferrer"
             className="group block bg-white p-6 rounded-sm border border-stone-200 shadow-sm hover:shadow-md hover:border-gold transition-all duration-300"
           >
             <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-stone-100 text-clay rounded-full group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                  <MapIcon />
                </div>
                <span className="text-stone-400 group-hover:text-gold transition-colors"><ExternalLinkIcon /></span>
             </div>
             <h3 className="font-serif text-lg text-ink font-medium group-hover:text-gold transition-colors leading-tight">
               {map.title}
             </h3>
             <p className="text-xs font-sans text-stone-400 mt-2 uppercase tracking-wider">View on Google Maps</p>
           </a>
         ))}
       </div>
    </section>
  );
};
