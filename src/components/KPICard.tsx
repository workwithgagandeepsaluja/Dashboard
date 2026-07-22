import { TrendingUp, TrendingDown, Users, CheckCircle, Trophy, Clock, AlertTriangle, BookOpen } from 'lucide-react';
import type { KPI } from '../data/sampleData';

const iconMap: Record<string, React.ElementType> = {
  'users': Users,
  'check-circle': CheckCircle,
  'trophy': Trophy,
  'clock': Clock,
  'alert-triangle': AlertTriangle,
  'book-open': BookOpen,
};

const iconColorMap: Record<string, string> = {
  'users': 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  'check-circle': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  'trophy': 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  'clock': 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  'alert-triangle': 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  'book-open': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
};

function formatValue(value: number, fmt: KPI['format']): string {
  switch (fmt) {
    case 'percent': return `${value}%`;
    case 'currency': return `$${value.toLocaleString()}`;
    case 'hours': return `${value.toLocaleString()}h`;
    default: return value.toLocaleString();
  }
}

export default function KPICard({ kpi }: { kpi: KPI }) {
  const Icon = iconMap[kpi.icon] || Users;
  const colorClass = iconColorMap[kpi.icon] || iconColorMap['users'];
  const change = kpi.value - kpi.previousValue;
  const changePercent = kpi.previousValue !== 0
    ? ((change / Math.abs(kpi.previousValue)) * 100).toFixed(1)
    : '0';

  const isPositive = kpi.icon === 'alert-triangle' ? change <= 0 : change >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{kpi.title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatValue(kpi.value, kpi.format)}
          </p>
          <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{isPositive ? '+' : ''}{changePercent}%</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">vs last period</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
