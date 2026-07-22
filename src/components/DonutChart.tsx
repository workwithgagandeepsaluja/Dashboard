import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { CategoryBreakdown } from '../data/sampleData';
import { useTheme } from '../context/ThemeContext';

interface Props {
  data: CategoryBreakdown[];
  title: string;
  subtitle: string;
}

export default function DonutChart({ data, title, subtitle }: Props) {
  const { dark } = useTheme();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-gray-400 dark:text-gray-500 text-sm">
          No data to display
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="h-56 w-56 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={1000}
                  animationBegin={200}
                  stroke="none"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: dark ? '#1f2937' : '#fff',
                    border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    color: dark ? '#f9fafb' : '#111827',
                    fontSize: '13px',
                  }}
                  formatter={(value: unknown) => [`${value} (${total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0}%)`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full grid grid-cols-2 gap-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600 dark:text-gray-300 truncate">{item.name}</span>
                <span className="text-gray-400 dark:text-gray-500 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
