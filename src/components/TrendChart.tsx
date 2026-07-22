import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';
import type { MonthlyTrend } from '../data/sampleData';
import { useTheme } from '../context/ThemeContext';

interface Props {
  data: MonthlyTrend[];
}

export default function TrendChart({ data }: Props) {
  const { dark } = useTheme();
  const gridColor = dark ? '#374151' : '#f3f4f6';
  const textColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Training Trends</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enrollments & completions over 12 months</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
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
            />
            <Legend
              wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="enrollments"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6366f1' }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              animationDuration={1200}
              name="Enrollments"
            />
            <Line
              type="monotone"
              dataKey="completions"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10b981' }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              animationDuration={1200}
              animationBegin={300}
              name="Completions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
