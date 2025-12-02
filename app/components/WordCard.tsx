
import React from 'react';
import { OriginalWord } from '@/types';

interface WordCardProps {
  data: OriginalWord;
}

export const WordCard: React.FC<WordCardProps> = ({ data }) => {
  const isHebrew = data.language === 'Hebrew';
  
  return (
    <div className="bg-surface border-l-4 border-gold p-6 shadow-sm my-4 font-serif">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm uppercase tracking-widest text-clay font-sans font-bold">{data.language}</span>
        <span className="text-sm text-stone italic font-sans">{data.transliteration}</span>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <h3 className={`text-4xl ${isHebrew ? 'font-serif' : 'font-serif'} text-ink`}>
          {data.original}
        </h3>
        <div className="h-px bg-stone flex-grow"></div>
        <h4 className="text-xl font-bold text-ink">{data.word}</h4>
      </div>

      <p className="text-ink mb-2 leading-relaxed">
        <span className="font-bold text-sm font-sans uppercase text-clay mr-2">Definition</span>
        {data.definition}
      </p>
      
      <div className="bg-paper p-3 rounded text-sm text-ink/80 italic border border-stone">
        "{data.usage}"
      </div>
    </div>
  );
};
