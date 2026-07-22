import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell
} from 'recharts';
import type { DepartmentData } from '../data/sampleData';
import { useTheme } from '../context/ThemeContext';

const barColors = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#10b981', '#f59e0b'];

interface Props {
  data: DepartmentData[];
}

export default function DepartmentBarChart({ data }: Props) {
  const { dark } = useTheme();
  const gridColor = dark ? '#374151' : '#f3f4f6';
  const textColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Department Performance</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Completion rate & avg score by department</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="department"
              tick={{ fontSize: 11, fill: textColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 12, fill: textColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: dark ? '#1f2937' : '#fff',
                border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                color: dark ? '#f9fafb' : '#111827',
              }}
              formatter={(value: unknown, name: unknown) => [
                `${value}${String(name).includes('Rate') || String(name).includes('Score') ? '%' : ''}`,
                String(name),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }} />
            <Bar dataKey="completionRate" name="Completion Rate %" radius={[4, 4, 0, 0]} animationDuration={1000}>
              {data.map((_, i) => (
                <Cell key={i} fill={barColors[i % barColors.length]} fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="avgScore" name="Avg Score %" fill="#94a3b8" radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={400} fillOpacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
