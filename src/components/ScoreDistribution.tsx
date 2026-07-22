import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import type { TrainingRecord } from '../data/sampleData';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';

interface Props {
  data: TrainingRecord[];
}

export default function ScoreDistribution({ data }: Props) {
  const { dark } = useTheme();
  const gridColor = dark ? '#374151' : '#f3f4f6';
  const textColor = dark ? '#9ca3af' : '#6b7280';

  const distribution = useMemo(() => {
    const buckets = [
      { range: '60-69', min: 60, max: 69, count: 0, color: '#ef4444' },
      { range: '70-79', min: 70, max: 79, count: 0, color: '#f97316' },
      { range: '80-89', min: 80, max: 89, count: 0, color: '#eab308' },
      { range: '90-95', min: 90, max: 95, count: 0, color: '#22c55e' },
      { range: '96-100', min: 96, max: 100, count: 0, color: '#10b981' },
    ];
    data.forEach(r => {
      if (r.score !== null) {
        const bucket = buckets.find(b => r.score! >= b.min && r.score! <= b.max);
        if (bucket) bucket.count++;
      }
    });
    return buckets;
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Score Distribution</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Assessment scores of completed trainings</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 12, fill: textColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: textColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: dark ? '#1f2937' : '#fff',
                border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                color: dark ? '#f9fafb' : '#111827',
              }}
              formatter={(value: unknown) => [`${value} learners`, 'Count']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1000}>
              {distribution.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
