
import React from 'react';
import { InterlinearData } from '@/types';

interface InterlinearProps {
  data: InterlinearData;
}

export const Interlinear: React.FC<InterlinearProps> = ({ data }) => {
  if (!data || !data.words || data.words.length === 0) return null;

  const isHebrew = data.language === 'Hebrew';
  const isAramaic = data.language === 'Aramaic';
  const isRTL = isHebrew || isAramaic;

  return (
    <section className="w-full bg-surface border-y border-stone py-8 mb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg text-ink tracking-widest uppercase">
            Interlinear <span className="text-gold text-xs ml-2 align-top border border-gold/30 px-1.5 py-0.5 rounded-full">{data.language}</span>
          </h3>
          <span className="font-serif text-clay italic">{data.reference}</span>
        </div>

        {/* 
          Container handles direction. 
          Flex-wrap allows words to flow naturally.
          Gap ensures separation.
        */}
        <div 
          className={`flex flex-wrap gap-y-8 gap-x-4 ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {data.words.map((word, index) => (
            <div key={index} className="flex flex-col items-center group min-w-[60px]">
              {/* Original Word */}
              <div className={`text-3xl mb-2 text-ink ${isRTL ? 'font-serif' : 'font-serif'} group-hover:text-gold transition-colors`}>
                {word.original}
              </div>
              
              {/* Divider */}
              <div className="w-full h-px bg-stone mb-1 group-hover:bg-gold/30 transition-colors"></div>

              {/* Transliteration */}
              <div className="text-xs text-stone font-sans italic mb-1">
                {word.transliteration}
              </div>

              {/* English Translation */}
              <div className="text-sm font-sans font-bold text-clay">
                {word.english}
              </div>
              
              {/* Morphology/Part of Speech */}
              <div className="text-[10px] text-stone/70 font-sans uppercase tracking-wider mt-1">
                {word.partOfSpeech}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
