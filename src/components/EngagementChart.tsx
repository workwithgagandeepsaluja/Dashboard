import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import type { DailyEngagement } from '../data/sampleData';
import { useTheme } from '../context/ThemeContext';

interface Props {
  data: DailyEngagement[];
}

export default function EngagementChart({ data }: Props) {
  const { dark } = useTheme();
  const gridColor = dark ? '#374151' : '#f3f4f6';
  const textColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Daily Engagement</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Active users & sessions (last 30 days)</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: textColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              interval={4}
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
            <Area
              type="monotone"
              dataKey="activeUsers"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorUsers)"
              animationDuration={1200}
              name="Active Users"
            />
            <Area
              type="monotone"
              dataKey="sessionsCompleted"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorSessions)"
              animationDuration={1200}
              animationBegin={300}
              name="Sessions Completed"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
