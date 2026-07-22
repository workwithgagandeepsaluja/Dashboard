import { useState, useMemo, useEffect, useRef } from 'react';
import { format, subDays } from 'date-fns';
import { Moon, Sun, GraduationCap, Download, Globe, ChevronRight } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  generateMonthlyTrends,
  generateDailyEngagement,
  generateCategoryBreakdown,
  generateDepartmentData,
  generateKPIs,
  generateStatusBreakdown,
  filterRecords,
  computeMonthlyTrendsFromRecords,
  computeDailyEngagementFromRecords,
} from './data/sampleData';
import { useSheetData } from './hooks/useSheetData';
import { downloadStandaloneHTML } from './data/googleSheets';
import KPICard from './components/KPICard';
import FilterBar from './components/FilterBar';
import DataSourcePanel from './components/DataSourcePanel';
import TrendChart from './components/TrendChart';
import DepartmentBarChart from './components/DepartmentBarChart';
import DonutChart from './components/DonutChart';
import EngagementChart from './components/EngagementChart';
import ScoreDistribution from './components/ScoreDistribution';
import DataTable from './components/DataTable';
import MMDataPage from './components/MMDataPage';

// ─── Page type ────────────────────────────────────────────────────────────────

type Page = 'ld' | 'mm';

// ─── Navigation Bar ───────────────────────────────────────────────────────────

function NavBar({ currentPage, onNavigate, dark, toggle }: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  dark: boolean;
  toggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Page links */}
          <div className="flex items-center gap-1">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-2">
              <GraduationCap size={20} className="text-white" />
            </div>

            {/* L&D Analytics link */}
            <button
              onClick={() => onNavigate('ld')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'ld'
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap size={16} />
              L&D Analytics
            </button>

            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 mx-1" />

            {/* MM Data link */}
            <button
              onClick={() => onNavigate('mm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'mm'
                  ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Globe size={16} />
              MM Data
            </button>
          </div>

          {/* Right side: Save + Dark mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadStandaloneHTML}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Save as standalone HTML file"
            >
              <Download size={14} />
              <span className="hidden lg:inline">Save as HTML</span>
            </button>
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-gray-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Sample data generation ───────────────────────────────────────────────────

const sampleMonthlyTrends = generateMonthlyTrends();
const sampleDailyEngagement = generateDailyEngagement();

// ─── L&D Analytics Page ───────────────────────────────────────────────────────

function LDPage() {
  const today = new Date();
  const dataSource = useSheetData();

  const [filters, setFilters] = useState({
    startDate: format(subDays(today, 365), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
    department: 'All',
    category: 'All',
    status: 'All',
  });

  const prevRecordsRef = useRef(dataSource.records);
  useEffect(() => {
    if (prevRecordsRef.current !== dataSource.records) {
      prevRecordsRef.current = dataSource.records;
      setFilters(prev => ({ ...prev, department: 'All', category: 'All', status: 'All' }));
    }
  }, [dataSource.records]);

  const uniqueDepartments = useMemo(() => [...new Set(dataSource.records.map(r => r.department))].sort(), [dataSource.records]);
  const uniqueCategories = useMemo(() => [...new Set(dataSource.records.map(r => r.category))].sort(), [dataSource.records]);
  const uniqueStatuses = useMemo(() => [...new Set(dataSource.records.map(r => r.status))].sort(), [dataSource.records]);

  const filteredRecords = useMemo(() => filterRecords(dataSource.records, { start: filters.startDate, end: filters.endDate }, filters.department, filters.category, filters.status), [dataSource.records, filters]);

  const monthlyTrends = useMemo(() => dataSource.type === 'sample' ? sampleMonthlyTrends : computeMonthlyTrendsFromRecords(dataSource.records), [dataSource.type, dataSource.records]);
  const dailyEngagement = useMemo(() => dataSource.type === 'sample' ? sampleDailyEngagement : computeDailyEngagementFromRecords(dataSource.records), [dataSource.type, dataSource.records]);

  const kpis = useMemo(() => generateKPIs(filteredRecords), [filteredRecords]);
  const categoryBreakdown = useMemo(() => generateCategoryBreakdown(filteredRecords), [filteredRecords]);
  const statusBreakdown = useMemo(() => generateStatusBreakdown(filteredRecords), [filteredRecords]);
  const departmentData = useMemo(() => generateDepartmentData(filteredRecords), [filteredRecords]);

  return (
    <>
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DataSourcePanel
          type={dataSource.type}
          sheetUrl={dataSource.sheetUrl}
          loading={dataSource.loading}
          error={dataSource.error}
          warnings={dataSource.warnings}
          lastFetched={dataSource.lastFetched}
          recordCount={dataSource.records.length}
          autoRefresh={dataSource.autoRefresh}
          refreshInterval={dataSource.refreshInterval}
          onConnectSheet={dataSource.fetchFromSheet}
          onUploadCSV={dataSource.loadCSVFile}
          onUseSample={dataSource.switchToSample}
          onRefresh={dataSource.refresh}
          onSetAutoRefresh={dataSource.setAutoRefresh}
          onSetRefreshInterval={dataSource.setRefreshInterval}
          onClearError={dataSource.clearError}
          onClearWarnings={dataSource.clearWarnings}
        />

        <FilterBar filters={filters} onChange={setFilters} departments={uniqueDepartments} categories={uniqueCategories} statuses={uniqueStatuses} />

        {dataSource.loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Fetching data from spreadsheet...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map(kpi => <KPICard key={kpi.id} kpi={kpi} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><TrendChart data={monthlyTrends} /></div>
          <DonutChart data={categoryBreakdown} title="Training Categories" subtitle="Distribution by category" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><DepartmentBarChart data={departmentData} /></div>
          <DonutChart data={statusBreakdown} title="Completion Status" subtitle="Overall training status" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EngagementChart data={dailyEngagement} />
          <ScoreDistribution data={filteredRecords} />
        </div>

        <DataTable data={filteredRecords} />
      </main>

      <footer className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-400 dark:text-gray-500">
          <span>© 2025 L&D Analytics Dashboard</span>
          <span>Last updated: {format(today, 'MMM dd, yyyy · h:mm a')}</span>
        </div>
      </footer>
    </>
  );
}

// ─── Main App with Navigation ─────────────────────────────────────────────────

function AppShell() {
  const { dark, toggle } = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    try {
      const saved = localStorage.getItem('ld-dashboard-page');
      if (saved === 'mm' || saved === 'ld') return saved;
    } catch { /* ignore */ }
    return 'ld';
  });

  const navigate = (page: Page) => {
    setCurrentPage(page);
    try { localStorage.setItem('ld-dashboard-page', page); } catch { /* ignore */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <NavBar currentPage={currentPage} onNavigate={navigate} dark={dark} toggle={toggle} />
      {currentPage === 'ld' ? <LDPage /> : <MMDataPage />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
