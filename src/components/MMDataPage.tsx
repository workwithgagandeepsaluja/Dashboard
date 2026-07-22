import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Star,
  MessageSquare, Mail, Globe, Shield, ThumbsUp, ThumbsDown, Minus,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw,
  Database, BarChart3, X, Cloud
} from 'lucide-react';
import { useMMData } from '../hooks/useMMData';
import { useTheme } from '../context/ThemeContext';
import type { NPSData, SurveyBreakdown, PlatformReview, FeedbackEntry, LQASession, EmailBounceData, MMDataSection } from '../data/mmData';

// ─── Shared Chart Colors ──────────────────────────────────────────────────────

const COLORS = {
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
};

function ChartTooltip({ dark }: { dark: boolean }) {
  return {
    contentStyle: {
      backgroundColor: dark ? '#1f2937' : '#fff',
      border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      color: dark ? '#f9fafb' : '#111827',
      fontSize: '13px',
    },
  };
}

// ─── KPI Card (reused from main dashboard) ────────────────────────────────────

function MMKPICard({
  title, value, subtitle, icon: Icon, trend, trendLabel,
  color = 'indigo', format = 'number'
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color?: string;
  format?: 'number' | 'percent' | 'decimal';
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  };

  const fmt = (n: number) => {
    if (format === 'percent') return `${n}%`;
    if (format === 'decimal') return n.toFixed(1);
    return n.toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {fmt(value)}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              {trendLabel && <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.indigo} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

// ─── Section Card Wrapper ─────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, subtitle }: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={18} className="text-indigo-500" />}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ─── NPS Section ──────────────────────────────────────────────────────────────

function NPSSection({ data }: { data: NPSData }) {
  const { dark } = useTheme();
  const tooltipProps = ChartTooltip({ dark });
  const gridColor = dark ? '#374151' : '#f3f4f6';
  const textColor = dark ? '#9ca3af' : '#6b7280';

  const trendData = data.trend.map((v, i) => ({
    month: `M${i + 1}`,
    score: v,
    target: data.target,
  }));

  const npsColor = data.score.mtd >= data.target ? COLORS.emerald : data.score.mtd >= data.target * 0.9 ? COLORS.amber : COLORS.red;

  return (
    <div className="space-y-6">
      {/* Top row: KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MMKPICard
          title="NPS Score (MTD)"
          value={data.score.mtd}
          icon={Star}
          color={data.score.mtd >= data.target ? 'emerald' : 'red'}
          trend={Math.round(((data.score.mtd - data.score.ytd) / Math.max(data.score.ytd, 1)) * 100)}
          trendLabel="vs YTD"
        />
        <MMKPICard
          title="NPS Score (YTD)"
          value={data.score.ytd}
          icon={Star}
          color="indigo"
          subtitle={`Target: ${data.target}`}
        />
        <MMKPICard
          title="Total Surveys (MTD)"
          value={data.totalSurveys.mtd}
          icon={MessageSquare}
          color="blue"
          subtitle={`YTD: ${data.totalSurveys.ytd.toLocaleString()}`}
        />
        <MMKPICard
          title="Response Rate"
          value={data.responseRate.mtd}
          icon={BarChart3}
          color="purple"
          format="percent"
          subtitle={`YTD: ${data.responseRate.ytd}%`}
        />
      </div>

      {/* NPS Trend Chart */}
      <SectionCard title="NPS Score Trend" subtitle="Monthly NPS progression with target line">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: textColor }} tickLine={false} axisLine={{ stroke: gridColor }} />
              <YAxis tick={{ fontSize: 12, fill: textColor }} tickLine={false} axisLine={{ stroke: gridColor }} domain={[0, 100]} />
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Line type="monotone" dataKey="score" stroke={npsColor} strokeWidth={3} dot={{ r: 4, fill: npsColor }} activeDot={{ r: 6 }} animationDuration={1000} name="NPS Score" />
              <Line type="monotone" dataKey="target" stroke={COLORS.amber} strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1000} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Full metrics table */}
      {data.allMetrics.length > 0 && (
        <SectionCard title="NPS Metrics Detail" icon={BarChart3}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Metric</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">MTD</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">YTD</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {data.allMetrics.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{m.metric}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">{m.mtd}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">{m.ytd}</td>
                    <td className="px-3 py-2.5 text-right text-gray-400 dark:text-gray-500">{m.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Surveys Section ──────────────────────────────────────────────────────────

function SurveysSection({ data }: { data: SurveyBreakdown }) {
  const { dark } = useTheme();
  const tooltipProps = ChartTooltip({ dark });

  const pieData = [
    { name: 'Promoters', value: data.promoters.count, pct: data.promoters.pct, color: COLORS.emerald },
    { name: 'Passives', value: data.passives.count, pct: data.passives.pct, color: COLORS.amber },
    { name: 'Detractors', value: data.detractors.count, pct: data.detractors.pct, color: COLORS.red },
  ];

  const mtdYtdData = [
    { name: 'Promoters', MTD: data.promoters.mtd, YTD: data.promoters.ytd },
    { name: 'Passives', MTD: data.passives.mtd, YTD: data.passives.ytd },
    { name: 'Detractors', MTD: data.detractors.mtd, YTD: data.detractors.ytd },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MMKPICard title="Total Surveys" value={data.total} icon={MessageSquare} color="indigo" />
        <MMKPICard title="Promoters" value={data.promoters.count} icon={ThumbsUp} color="emerald" format="percent" subtitle={`${data.promoters.pct}% of total`} />
        <MMKPICard title="Passives" value={data.passives.count} icon={Minus} color="amber" format="percent" subtitle={`${data.passives.pct}% of total`} />
        <MMKPICard title="Detractors" value={data.detractors.count} icon={ThumbsDown} color="red" format="percent" subtitle={`${data.detractors.pct}% of total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <SectionCard title="Survey Breakdown" subtitle="Promoters vs Passives vs Detractors">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none" animationDuration={1000}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...tooltipProps} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{item.pct}%</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* MTD vs YTD bar chart */}
        <SectionCard title="MTD vs YTD" subtitle="Survey counts comparison">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mtdYtdData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <Tooltip {...tooltipProps} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="MTD" fill={COLORS.blue} radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="YTD" fill={COLORS.purple} radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={300} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────

function ReviewsSection({ reviews }: { reviews: PlatformReview[] }) {
  const { dark } = useTheme();
  const tooltipProps = ChartTooltip({ dark });

  const ratingData = reviews.map(r => ({
    platform: r.platform,
    rating: r.rating,
    negative: r.negativeCount,
  }));

  const platformColors = [COLORS.indigo, COLORS.blue, COLORS.teal, COLORS.purple, COLORS.pink, COLORS.amber];

  return (
    <div className="space-y-6">
      {/* Platform cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {reviews.map((r, i) => (
          <div key={r.platform} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Globe size={16} style={{ color: platformColors[i % platformColors.length] }} />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.platform}</span>
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={18} className="text-amber-400 fill-amber-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{r.rating}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{r.ytdReviews} reviews</p>
            {r.negativeCount > 0 && (
              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-red-500">
                <AlertTriangle size={12} />
                <span>{r.negativeCount} negative</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Ratings by Platform" subtitle="Average guest rating per platform">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="platform" tick={{ fontSize: 11, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} domain={[0, 10]} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="rating" radius={[4, 4, 0, 0]} animationDuration={1000}>
                  {ratingData.map((_, i) => <Cell key={i} fill={platformColors[i % platformColors.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Review Volume & Negatives" subtitle="Monthly reviews vs negative feedback count">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviews} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="platform" tick={{ fontSize: 11, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <Tooltip {...tooltipProps} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="mtdReviews" fill={COLORS.blue} name="MTD Reviews" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="negativeCount" fill={COLORS.red} name="Negative" radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={300} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Negative Feedback Section ────────────────────────────────────────────────

function NegativeFeedbackSection({ feedback }: { feedback: FeedbackEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (feedback.length === 0) {
    return (
      <SectionCard title="Negative Guest Feedback" icon={AlertTriangle} subtitle="No negative feedback entries found">
        <div className="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500">
          <CheckCircle size={24} className="text-emerald-500 mr-2" />
          <span>No negative feedback to review</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Negative Guest Feedback" icon={AlertTriangle} subtitle={`${feedback.length} negative entries — requires attention`}>
      <div className="space-y-3">
        {feedback.map((f, i) => {
          const isExpanded = expanded === `${i}`;
          const isResolved = f.status.toLowerCase().includes('resolved');
          return (
            <div
              key={i}
              className={`rounded-xl border-2 transition-colors ${isResolved ? 'border-gray-200 dark:border-gray-600' : 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10'}`}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : `${i}`)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isResolved ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                    {isResolved ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{f.guestName || 'Anonymous'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{f.platform}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{f.category}</span>
                      {f.rating && <span className="text-xs text-red-500 font-medium">★ {f.rating}</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{f.feedback}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${isResolved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : f.status.toLowerCase().includes('progress') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                    {f.status}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{f.feedback}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
                    {f.date && <span>Date: {f.date}</span>}
                    {f.sentiment && <span>Sentiment: {f.sentiment}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── LQA Section ──────────────────────────────────────────────────────────────

function LQASection({ sessions }: { sessions: LQASession[] }) {
  const statusColors: Record<string, string> = {
    'completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    'in progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    'scheduled': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };

  const completedSessions = sessions.filter(s => s.score !== null);
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
    : 0;

  const completedCount = sessions.filter(s => s.status.toLowerCase() === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MMKPICard title="Total Sessions" value={sessions.length} icon={Shield} color="indigo" />
        <MMKPICard title="Completed" value={completedCount} icon={CheckCircle} color="emerald" subtitle={`of ${sessions.length} total`} />
        <MMKPICard title="Average Score" value={avgScore} icon={Star} color="purple" format="percent" />
        <MMKPICard
          title="On Track"
          value={avgScore >= 80 ? 1 : 0}
          icon={avgScore >= 80 ? ThumbsUp : AlertTriangle}
          color={avgScore >= 80 ? 'emerald' : 'red'}
          subtitle={avgScore >= 80 ? 'Meeting target' : 'Below target'}
        />
      </div>

      <SectionCard title="LQA Sessions" icon={Shield} subtitle="Training quality assurance tracker">
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.score !== null && s.score >= 80 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : s.score !== null ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                {s.score !== null ? <Star size={16} /> : <Clock size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{s.session}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status.toLowerCase()] || statusColors['scheduled']}`}>
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {s.date && <span>{s.date}</span>}
                  {s.trainer && <span>Trainer: {s.trainer}</span>}
                </div>
                {s.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{s.notes}</p>}
              </div>
              {s.score !== null && (
                <div className={`text-lg font-bold flex-shrink-0 ${s.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {s.score}%
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Email Bounce Section ─────────────────────────────────────────────────────

function EmailBounceSection({ data }: { data: EmailBounceData }) {
  const { dark } = useTheme();
  const tooltipProps = ChartTooltip({ dark });

  const rateData = data.allMetrics.filter(m =>
    m.metric.toLowerCase().includes('rate')
  ).map(m => ({
    metric: m.metric,
    MTD: parseFloat(m.mtd.replace('%', '')) || 0,
    YTD: parseFloat(m.ytd.replace('%', '')) || 0,
    Target: parseFloat(m.target.replace(/[<>%]/g, '')) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MMKPICard
          title="Bounce Rate (MTD)"
          value={data.bounceRate.mtd}
          icon={Mail}
          color={data.bounceRate.mtd <= data.target ? 'emerald' : 'red'}
          format="decimal"
          trend={Math.round(((data.bounceRate.mtd - data.bounceRate.ytd) / Math.max(data.bounceRate.ytd, 0.1)) * 100)}
          trendLabel="vs YTD"
          subtitle={`Target: <${data.target}%`}
        />
        <MMKPICard title="Bounce Rate (YTD)" value={data.bounceRate.ytd} icon={Mail} color="indigo" format="decimal" subtitle={`Target: <${data.target}%`} />
        <MMKPICard title="Open Rate (MTD)" value={data.openRate.mtd} icon={ExternalLink} color="blue" format="decimal" subtitle="%" />
        <MMKPICard title="Total Sent (MTD)" value={data.totalSent.mtd} icon={BarChart3} color="purple" subtitle={`Bounced: ${data.bounced.mtd}`} />
      </div>

      {rateData.length > 0 && (
        <SectionCard title="Email Metrics" icon={Mail} subtitle="MTD vs YTD rate comparison">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rateData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <Tooltip {...tooltipProps} formatter={(value: unknown) => [`${value}%`, '']} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="MTD" fill={COLORS.blue} radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="YTD" fill={COLORS.purple} radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={300} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {data.allMetrics.length > 0 && (
        <SectionCard title="Email Metrics Detail" icon={BarChart3}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Metric</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">MTD</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">YTD</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {data.allMetrics.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{m.metric}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">{m.mtd}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300">{m.ytd}</td>
                    <td className="px-3 py-2.5 text-right text-gray-400 dark:text-gray-500">{m.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Generic Section (dynamic) ────────────────────────────────────────────────

function GenericSection({ section }: { section: MMDataSection }) {
  const { dark } = useTheme();
  const headers = section.headers;
  const rows = section.rows;

  // Try to detect if there's numeric data for a chart
  const numericCols = headers.filter(h => rows.some(r => !isNaN(Number(r[h])) && r[h] !== ''));
  const hasChartData = numericCols.length > 0 && rows.length >= 2;

  const chartData = hasChartData ? rows.slice(0, 12).map(r => {
    const obj: Record<string, string | number> = { name: r[headers[0]] || '' };
    numericCols.forEach(col => {
      obj[col] = Number(r[col]) || 0;
    });
    return obj;
  }) : [];

  const chartColors = [COLORS.indigo, COLORS.emerald, COLORS.blue, COLORS.purple, COLORS.amber, COLORS.teal];

  return (
    <div className="space-y-6">
      {hasChartData && (
        <SectionCard title={`${section.title} — Chart`} subtitle="Auto-detected numeric data">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: dark ? '#9ca3af' : '#6b7280' }} tickLine={false} />
                <Tooltip {...ChartTooltip({ dark })} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                {numericCols.map((col, i) => (
                  <Bar key={col} dataKey={col} fill={chartColors[i % chartColors.length]} radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={i * 200} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      <SectionCard title={`${section.title} — Data`} icon={BarChart3}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {headers.map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  {headers.map(h => (
                    <td key={h} className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{row[h] || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── MM Data Connection Panel ─────────────────────────────────────────────────

function MMConnectionPanel({ onConnect, onSample, loading, error, sheetUrl, lastFetched, autoRefresh, refreshInterval, onSetAutoRefresh, onSetRefreshInterval, onRefresh, onClearError, mode }: {
  onConnect: (url: string) => void;
  onSample: () => void;
  loading: boolean;
  error: string | null;
  sheetUrl: string;
  lastFetched: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
  onSetAutoRefresh: (v: boolean) => void;
  onSetRefreshInterval: (v: number) => void;
  onRefresh: () => void;
  onClearError: () => void;
  mode: 'sample' | 'sheet';
}) {
  const [expanded, setExpanded] = useState(false);
  const [urlInput, setUrlInput] = useState(sheetUrl);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Globe size={18} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">MM Data Source</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${mode === 'sheet' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {mode === 'sheet' ? <><Cloud size={14} /> Google Sheet</> : <><Database size={14} /> Sample Data</>}
          </span>
          {loading && <RefreshCw size={14} className="text-indigo-500 animate-spin" />}
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && !expanded && <span className="text-xs text-gray-400 hidden sm:inline">Updated {lastFetched.toLocaleTimeString()}</span>}
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button onClick={onClearError} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Paste Google Sheets URL for Morning Meeting data..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onConnect(urlInput); } }}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => onConnect(urlInput)}
              disabled={loading || !urlInput.trim()}
              className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><RefreshCw size={14} className="animate-spin" /> Connecting...</> : <><ExternalLink size={14} /> Connect</>}
            </button>
            <button
              onClick={onSample}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'sample' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'}`}
            >
              {mode === 'sample' ? '✓ Sample Data' : 'Use Sample'}
            </button>
          </div>

          {mode === 'sheet' && (
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                <input type="checkbox" checked={autoRefresh} onChange={e => onSetAutoRefresh(e.target.checked)} className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500" />
                Auto-refresh
              </label>
              {autoRefresh && (
                <select value={refreshInterval} onChange={e => onSetRefreshInterval(Number(e.target.value))} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none">
                  <option value={60}>Every 1 min</option>
                  <option value={120}>Every 2 min</option>
                  <option value={300}>Every 5 min</option>
                  <option value={600}>Every 10 min</option>
                </select>
              )}
              <button onClick={onRefresh} disabled={loading} className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-50">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                Refresh now
              </button>
              {lastFetched && <span className="text-gray-400">Last: {lastFetched.toLocaleString()}</span>}
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Expected sheet structure (use multiple tabs):</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['NPS → Metric, MTD, YTD, Target', 'Surveys → Category, Count, %', 'Reviews → Platform, Rating, Reviews', 'Feedback → Date, Guest, Platform, Feedback', 'LQA → Session, Date, Status, Score', 'Email → Metric, MTD, YTD, Target'].map(s => (
                <span key={s} className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />{s}</span>
              ))}
            </div>
            <p className="mt-2">Any additional tabs are auto-detected and rendered as charts + tables.</p>
          </div>
        </div>
      )}
    </div>
  );
}



// ─── Main MM Data Page ────────────────────────────────────────────────────────

export default function MMDataPage() {
  const mmData = useMMData();

  // Section nav state
  const [activeSection, setActiveSection] = useState('all');

  const sectionTabs = useMemo(() => {
    const tabs: { id: string; label: string; count?: number }[] = [{ id: 'all', label: 'All Sections' }];
    if (mmData.data.nps) tabs.push({ id: 'nps', label: 'NPS' });
    if (mmData.data.surveys) tabs.push({ id: 'surveys', label: 'Surveys' });
    if (mmData.data.reviews.length > 0) tabs.push({ id: 'reviews', label: 'Reviews' });
    if (mmData.data.negativeFeedback.length > 0 || mmData.data.allFeedback.length > 0) {
      tabs.push({ id: 'feedback', label: 'Feedback', count: mmData.data.negativeFeedback.length });
    }
    if (mmData.data.lqaSessions.length > 0) tabs.push({ id: 'lqa', label: 'LQA' });
    if (mmData.data.emailBounce) tabs.push({ id: 'email', label: 'Email' });
    mmData.data.customSections.forEach(s => tabs.push({ id: s.id, label: s.title }));
    return tabs;
  }, [mmData.data]);

  return (
    <>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Connection */}
        <MMConnectionPanel
          onConnect={mmData.fetchSheet}
          onSample={mmData.switchToSample}
          loading={mmData.loading}
          error={mmData.error}
          sheetUrl={mmData.sheetUrl}
          lastFetched={mmData.lastFetched}
          autoRefresh={mmData.autoRefresh}
          refreshInterval={mmData.refreshInterval}
          onSetAutoRefresh={mmData.setAutoRefresh}
          onSetRefreshInterval={mmData.setRefreshInterval}
          onRefresh={mmData.refresh}
          onClearError={mmData.clearError}
          mode={mmData.mode}
        />

        {/* Loading */}
        {mmData.loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Fetching MM data from spreadsheet...</span>
            </div>
          </div>
        )}

        {/* Section navigation tabs */}
        {sectionTabs.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {sectionTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeSection === tab.id ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'}`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* NPS */}
        {(activeSection === 'all' || activeSection === 'nps') && mmData.data.nps && (
          <NPSSection data={mmData.data.nps} />
        )}

        {/* Surveys */}
        {(activeSection === 'all' || activeSection === 'surveys') && mmData.data.surveys && (
          <SurveysSection data={mmData.data.surveys} />
        )}

        {/* Reviews */}
        {(activeSection === 'all' || activeSection === 'reviews') && mmData.data.reviews.length > 0 && (
          <ReviewsSection reviews={mmData.data.reviews} />
        )}

        {/* Negative Feedback */}
        {(activeSection === 'all' || activeSection === 'feedback') && (
          <NegativeFeedbackSection feedback={mmData.data.negativeFeedback.length > 0 ? mmData.data.negativeFeedback : mmData.data.allFeedback} />
        )}

        {/* LQA */}
        {(activeSection === 'all' || activeSection === 'lqa') && mmData.data.lqaSessions.length > 0 && (
          <LQASection sessions={mmData.data.lqaSessions} />
        )}

        {/* Email Bounce */}
        {(activeSection === 'all' || activeSection === 'email') && mmData.data.emailBounce && (
          <EmailBounceSection data={mmData.data.emailBounce} />
        )}

        {/* Custom / Generic Sections */}
        {mmData.data.customSections.map(section => (
          (activeSection === 'all' || activeSection === section.id) && (
            <GenericSection key={section.id} section={section} />
          )
        ))}
      </main>

      <footer className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-400 dark:text-gray-500">
          <span>© 2025 MM Data — Morning Meeting Dashboard</span>
          <span>{mmData.mode === 'sheet' ? 'Connected to Google Sheets' : 'Using sample data'}</span>
        </div>
      </footer>
    </>
  );
}
