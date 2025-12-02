
import React from 'react';
import { ExternalResource } from '@/types';

interface ResourceSectionProps {
  resources: ExternalResource[];
}

const LibraryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

const ExternalArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

export const ResourceSection: React.FC<ResourceSectionProps> = ({ resources }) => {
  if (!resources || resources.length === 0) return null;

  return (
    <section className="animate-fade-in-up pt-8">
       <div className="flex items-center gap-3 mb-6 border-b border-gold/30 pb-2 inline-block">
         <span className="text-gold"><LibraryIcon /></span>
         <h2 className="font-display text-2xl text-ink">External Resources</h2>
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         {resources.map((res, index) => (
           <a 
             key={index} 
             href={res.uri} 
             target="_blank" 
             rel="noopener noreferrer"
             className="group block p-4 bg-surface border border-stone rounded-sm hover:border-gold hover:shadow-sm transition-all duration-200"
           >
             <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-sans uppercase tracking-widest text-stone mb-1 group-hover:text-gold transition-colors">
                    {res.siteTitle}
                  </p>
                  <h3 className="font-serif text-lg text-ink leading-tight group-hover:text-gold transition-colors">
                    {res.title}
                  </h3>
                </div>
                <span className="text-stone/50 group-hover:text-gold transition-colors mt-1">
                  <ExternalArrow />
                </span>
             </div>
           </a>
         ))}
       </div>
       <p className="mt-4 text-xs font-sans text-stone text-center">
         Links from Chabad.org, First Fruits of Zion (FFOZ), and Sefaria.
       </p>
    </section>
  );
};
