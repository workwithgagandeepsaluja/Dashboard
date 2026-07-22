import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TrainingRecord } from '../data/sampleData';

interface Props {
  data: TrainingRecord[];
}

type SortKey = keyof TrainingRecord;
type SortDir = 'asc' | 'desc';

const statusStyles: Record<string, string> = {
  'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  'Not Started': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  'Overdue': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const PAGE_SIZE = 10;

export default function DataTable({ data }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  // Reset page when data source changes
  useEffect(() => {
    setPage(0);
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(r =>
      r.employeeName.toLowerCase().includes(q) ||
      r.courseName.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        const aNum = aVal ? 1 : 0;
        const bNum = bVal ? 1 : 0;
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // Clamp page to valid range
  const safePage = Math.min(page, totalPages - 1);
  const pageData = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Sync page if it became out of range
  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={14} className="opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: 'employeeName', label: 'Employee' },
    { key: 'department', label: 'Department', className: 'hidden md:table-cell' },
    { key: 'courseName', label: 'Course' },
    { key: 'category', label: 'Category', className: 'hidden lg:table-cell' },
    { key: 'status', label: 'Status' },
    { key: 'score', label: 'Score', className: 'hidden sm:table-cell' },
    { key: 'timeSpent', label: 'Hours', className: 'hidden sm:table-cell' },
    { key: 'enrollmentDate', label: 'Enrolled', className: 'hidden xl:table-cell' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Records</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} records found</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64 transition-colors"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none transition-colors ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {pageData.map((row, idx) => (
              <tr key={`${row.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{row.employeeName}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{row.department}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{row.courseName}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden lg:table-cell">{row.category}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[row.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{row.score !== null ? `${row.score}%` : '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{row.timeSpent}h</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden xl:table-cell">{row.enrollmentDate}</td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                  No records match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {safePage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
