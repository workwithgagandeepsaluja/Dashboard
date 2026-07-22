import { Calendar, Filter } from 'lucide-react';

interface Filters {
  startDate: string;
  endDate: string;
  department: string;
  category: string;
  status: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  departments: string[];
  categories: string[];
  statuses: string[];
}

export default function FilterBar({ filters, onChange, departments, categories, statuses }: Props) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const selectClass = "px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors appearance-none cursor-pointer";
  const dateClass = "px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Filter size={16} />
          <span className="text-sm font-medium hidden sm:inline">Filters</span>
        </div>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block" />

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <input
            type="date"
            value={filters.startDate}
            onChange={e => update('startDate', e.target.value)}
            className={dateClass}
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={e => update('endDate', e.target.value)}
            className={dateClass}
          />
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 hidden lg:block" />

        <select
          value={filters.department}
          onChange={e => update('department', e.target.value)}
          className={selectClass}
        >
          <option value="All">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={filters.category}
          onChange={e => update('category', e.target.value)}
          className={selectClass}
        >
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filters.status}
          onChange={e => update('status', e.target.value)}
          className={selectClass}
        >
          <option value="All">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button
          onClick={() => onChange({
            startDate: filters.startDate,
            endDate: filters.endDate,
            department: 'All',
            category: 'All',
            status: 'All',
          })}
          className="px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors font-medium"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
