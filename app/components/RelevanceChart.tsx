
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BookStats } from '@/types';

interface FrequencyChartProps {
  data: BookStats[];
}

export const FrequencyChart: React.FC<FrequencyChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="my-8 p-6 bg-surface/50 border border-stone rounded-sm">
      <h4 className="font-sans text-xs font-bold tracking-widest uppercase text-clay mb-6 text-center">Biblical Distribution</h4>
      <div className="h-[250px] w-full font-sans text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="book" 
              type="category" 
              width={80} 
              tick={{fill: 'var(--color-clay)', fontSize: 11, fontWeight: 500}} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-gold)', fontFamily: 'serif', color: 'var(--color-ink)' }}
              itemStyle={{ color: 'var(--color-ink)' }}
              formatter={(value: number) => [`${value} occurrences`, 'Frequency']}
            />
            <Bar dataKey="count" barSize={16} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="var(--color-gold)" fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
