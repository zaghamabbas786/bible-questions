
import React from 'react';

interface GoogleMapEmbedProps {
  location: string;
}

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.292 1.89l-1.22 1.956c-.187.3-.556.444-.882.314l-.524-.22a.409.409 0 0 1-.23-.405l.108-.956c.024-.217.06-.434.106-.646l.472-2.08c.07-.31.43-.48.72-.34l.226.106c.42.197.914-.03 1.09-.468l.176-.427a.409.409 0 0 0-.319-.554l-1.558-.267a.411.411 0 0 1-.332-.452l.08-.588c.04-.29.313-.486.602-.433l.486.086c.48.085.903-.21.969-.693l.017-.126a.409.409 0 0 0-.565-.434l-.85.355a.41.41 0 0 1-.43-.094l-.403-.403a.411.411 0 0 1-.104-.397l.107-.535a.41.41 0 0 0-.54-.457l-.988.33a2.25 2.25 0 0 1-2.19-.98l-.676-.902C5.59 2.84 6.76 2.25 8 2.25c2.761 0 5.295 1.115 7.108 2.895l-.614.614a.409.409 0 0 0 .147.645l1.08.432c.29.116.616-.016.752-.298l.129-.266a.409.409 0 0 0-.212-.545l-.636-.255A7.478 7.478 0 0 0 12 2.25c-.64 0-1.26.08-1.853.23l1.34.67a.75.75 0 0 1 .372.914l-.168.503a.75.75 0 0 1-1.262.23l-.447-.447V3.03Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12c0 .18-.013.357-.037.53l-.811 4.051a.75.75 0 0 1-.736.603l-4.352.016c-.447 0-.803-.385-.762-.83l.522-5.74a.75.75 0 0 1 .685-.68l3.983-.306a.75.75 0 0 1 .816.748V12Z" />
  </svg>
);

export const GoogleMapEmbed: React.FC<GoogleMapEmbedProps> = ({ location }) => {
  if (!location) return null;

  // Use 't=p' for terrain/physical map which looks cleaner/simplified
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=p&z=8&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="animate-fade-in-up pt-8">
      <div className="flex items-center gap-3 mb-6 border-b border-gold/30 pb-2 inline-block">
        <span className="text-gold"><GlobeIcon /></span>
        <h2 className="font-display text-2xl text-ink">Modern Region</h2>
      </div>

      <div className="w-full bg-white p-1 rounded-sm border border-stone-200 shadow-sm">
        <iframe 
          width="100%" 
          height="400" 
          frameBorder="0" 
          scrolling="no" 
          marginHeight={0} 
          marginWidth={0} 
          src={src}
          title={`Map of ${location}`}
          className="filter grayscale-[0.2] contrast-[0.95]"
        >
        </iframe>
        <div className="p-2 text-center">
           <p className="text-[10px] font-sans text-stone-400 uppercase tracking-widest">
             Modern Map of {location}
           </p>
        </div>
      </div>
    </section>
  );
};
