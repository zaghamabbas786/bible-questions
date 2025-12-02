
import React from 'react';

interface ImageSectionProps {
  images: string[];
  prompt: string;
}

const ArtifactIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

export const ImageSection: React.FC<ImageSectionProps> = ({ images, prompt }) => {
  if (!images || images.length === 0) return null;

  return (
    <section className="animate-fade-in-up pt-8">
       <div className="flex items-center gap-3 mb-6 border-b border-gold/30 pb-2 inline-block">
         <span className="text-gold"><ArtifactIcon /></span>
         <h2 className="font-display text-2xl text-ink">Visual Context & Artifacts</h2>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {images.map((imgSrc, index) => (
           <div 
             key={index}
             className="group bg-white p-3 rounded-sm border border-stone-200 shadow-sm hover:shadow-lg hover:border-gold transition-all duration-500"
           >
             <div className="aspect-[4/3] overflow-hidden bg-stone-100 mb-3 relative">
                <img 
                  src={imgSrc} 
                  alt={`Historical artifact visualization ${index + 1}`} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
             </div>
             <p className="text-xs font-sans text-stone-400 uppercase tracking-wider text-center">
               Figure {index + 1}
             </p>
           </div>
         ))}
       </div>
       
       <p className="mt-4 text-center text-stone-400 text-xs font-serif italic">
         * AI Generated visualizations based on historical descriptions: "{prompt}"
       </p>
    </section>
  );
};
