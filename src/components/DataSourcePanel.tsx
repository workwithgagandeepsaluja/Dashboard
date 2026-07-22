import { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet, Upload, RefreshCw, Database, ExternalLink, X,
  Check, AlertCircle, Info, ChevronDown, ChevronUp, Download,
  Cloud, HardDrive, Wifi, WifiOff, Copy, Clock, Table, FileText
} from 'lucide-react';
import type { DataSourceType } from '../hooks/useSheetData';
import { generateTemplateCSV, generateSampleDataCSV, generateBlankTemplateCSV } from '../data/googleSheets';

interface Props {
  type: DataSourceType;
  sheetUrl: string;
  loading: boolean;
  error: string | null;
  warnings: string[];
  lastFetched: Date | null;
  recordCount: number;
  autoRefresh: boolean;
  refreshInterval: number;
  onConnectSheet: (url: string) => void;
  onUploadCSV: (text: string, name: string) => void;
  onUseSample: () => void;
  onRefresh: () => void;
  onSetAutoRefresh: (enabled: boolean) => void;
  onSetRefreshInterval: (seconds: number) => void;
  onClearError: () => void;
  onClearWarnings: () => void;
}

export default function DataSourcePanel({
  type, sheetUrl, loading, error, warnings, lastFetched, recordCount,
  autoRefresh, refreshInterval,
  onConnectSheet, onUploadCSV, onUseSample, onRefresh,
  onSetAutoRefresh, onSetRefreshInterval,
  onClearError, onClearWarnings,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [urlInput, setUrlInput] = useState(sheetUrl);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep url input in sync when sheetUrl prop changes (e.g. after connect)
  useEffect(() => {
    setUrlInput(sheetUrl);
  }, [sheetUrl]);

  const handleConnect = () => {
    if (urlInput.trim()) {
      onConnectSheet(urlInput.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        onUploadCSV(text, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedTemplate(label);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch {
      // fallback: trigger download instead
      downloadCSV(text, label + '.csv');
    }
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sourceLabel: Record<DataSourceType, { icon: React.ReactNode; label: string; color: string }> = {
    'sample': {
      icon: <Database size={14} />,
      label: 'Sample Data',
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    },
    'google-sheet': {
      icon: <Cloud size={14} />,
      label: 'Google Sheet',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    },
    'csv-file': {
      icon: <HardDrive size={14} />,
      label: 'CSV File',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    },
  };

  const currentSource = sourceLabel[type];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* ── Collapsed header bar ─────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <FileSpreadsheet size={18} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Data Source</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${currentSource.color}`}>
            {currentSource.icon}
            {currentSource.label}
          </span>
          {type === 'google-sheet' && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              {autoRefresh ? (
                <><Wifi size={12} className="text-emerald-500" /> Auto-refresh</>
              ) : (
                <><WifiOff size={12} /> Manual</>
              )}
            </span>
          )}
          {loading && (
            <RefreshCw size={14} className="text-indigo-500 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && !expanded && (
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
              Updated {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <span className="text-xs text-gray-400">{recordCount} records</span>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* ── Expanded panel ───────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-5 space-y-5">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Connection Error</p>
                <p className="mt-0.5 opacity-80 whitespace-pre-line">{error}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onClearError(); }}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
              <Info size={18} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {warnings.map((w, i) => <p key={i} className="mt-0.5">{w}</p>)}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onClearWarnings(); }}
                className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                aria-label="Dismiss warnings"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Quick Start: Get a sample spreadsheet ─────────── */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Table size={16} className="text-indigo-500" />
                  Need a sample spreadsheet to get started?
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Download a ready-made 50-record training data file, open it in Excel or Google Sheets, then connect or upload it here.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => downloadCSV(generateSampleDataCSV(), 'LD_Sample_Training_Data_50_Records.csv')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  <Download size={14} />
                  Download Sample (50 rows)
                </button>
                <button
                  onClick={() => downloadCSV(generateBlankTemplateCSV(), 'LD_Training_Template_Blank.csv')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
                  title="Download a blank CSV with just the header row"
                >
                  <FileText size={14} />
                  Blank Template
                </button>
              </div>
            </div>
          </div>

          {/* ── Three source option cards ─────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Google Sheets */}
            <div className={`p-4 rounded-xl border-2 transition-colors ${type === 'google-sheet' ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Cloud size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Google Sheets</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Live connection</p>
                </div>
                {type === 'google-sheet' && <Check size={16} className="text-emerald-500 ml-auto" />}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Paste Google Sheets URL..."
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConnect(); } }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
                <button
                  onClick={handleConnect}
                  disabled={loading || !urlInput.trim()}
                  className="w-full px-3 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><RefreshCw size={14} className="animate-spin" /> Connecting...</>
                  ) : (
                    <><ExternalLink size={14} /> Connect Sheet</>
                  )}
                </button>
              </div>

              {type === 'google-sheet' && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={e => onSetAutoRefresh(e.target.checked)}
                        className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      Auto-refresh
                    </label>
                    <button
                      onClick={onRefresh}
                      disabled={loading}
                      className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                      Refresh now
                    </button>
                  </div>
                  {autoRefresh && (
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-gray-400" />
                      <select
                        value={refreshInterval}
                        onChange={e => onSetRefreshInterval(Number(e.target.value))}
                        className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={30}>Every 30s</option>
                        <option value={60}>Every 1 min</option>
                        <option value={120}>Every 2 min</option>
                        <option value={300}>Every 5 min</option>
                        <option value={600}>Every 10 min</option>
                      </select>
                    </div>
                  )}
                  {lastFetched && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Last fetched: {lastFetched.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* CSV Upload */}
            <div className={`p-4 rounded-xl border-2 transition-colors ${type === 'csv-file' ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Upload size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Upload CSV</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Local file</p>
                </div>
                {type === 'csv-file' && <Check size={16} className="text-blue-500 ml-auto" />}
              </div>

              <input
                type="file"
                accept=".csv,.tsv,.txt"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={14} />
                Choose CSV File
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Upload a .csv exported from Excel, Google Sheets, Numbers, or any spreadsheet app
              </p>
            </div>

            {/* Sample Data */}
            <div className={`p-4 rounded-xl border-2 transition-colors ${type === 'sample' ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <Database size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Sample Data</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Demo mode</p>
                </div>
                {type === 'sample' && <Check size={16} className="text-indigo-500 ml-auto" />}
              </div>

              <button
                onClick={onUseSample}
                className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${type === 'sample' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300'}`}
              >
                <Database size={14} />
                {type === 'sample' ? 'Using Sample Data' : 'Switch to Sample'}
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                250 realistic training records for demo purposes
              </p>
            </div>
          </div>

          {/* ── Template & Instructions toggle ─────────────────── */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              <Info size={14} />
              {showInstructions ? 'Hide' : 'Show'} Setup Instructions
            </button>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />
            <button
              onClick={() => copyToClipboard(generateTemplateCSV(), 'template')}
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
            >
              {copiedTemplate === 'template' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedTemplate === 'template' ? 'Copied!' : 'Copy 5-Row Template'}
            </button>
          </div>

          {/* ── Instructions ───────────────────────────────────── */}
          {showInstructions && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4 text-sm">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-indigo-500" />
                How to Connect Your Data
              </h4>

              <ol className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <div>
                    <strong>Get the sample spreadsheet</strong> — click{" "}
                    <strong className="text-indigo-600 dark:text-indigo-400">Download Sample (50 rows)</strong>{" "}
                    above. Open it in Excel, Google Sheets, or any spreadsheet app to see the expected format.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <div>
                    <strong>Replace with your data</strong> — keep the header row (Row 1) and fill in your real training records below it.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <div>
                    <strong>Connect it</strong> — either:
                    <ul className="mt-1.5 ml-4 list-disc space-y-1 text-xs">
                      <li><strong>Google Sheets:</strong> Paste the URL above (set sharing to "Anyone with the link → Viewer")</li>
                      <li><strong>CSV file:</strong> Export from your spreadsheet app (File → Download → CSV) and upload</li>
                    </ul>
                  </div>
                </li>
              </ol>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3.5 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Expected Column Headers (Row 1):</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Employee Name', 'Department', 'Course Name', 'Category', 'Status', 'Enrollment Date', 'Completion Date', 'Score', 'Time Spent (Hours)', 'Mandatory'].map(h => (
                    <code key={h} className="px-2 py-0.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs">{h}</code>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3.5 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Accepted Status Values:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
                    { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
                    { label: 'Not Started', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
                    { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
                  ].map(s => (
                    <span key={s.label} className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Also accepts: Pending, Ongoing, Expired, Past Due, Completed, Enrolled, Not Begun
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3.5 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Accepted Date & Number Formats:</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <strong>Dates:</strong> 2025-01-15, 01/15/2025, 15-01-2025 &nbsp;|&nbsp;
                  <strong>Scores:</strong> 85, 85%, 92.5 &nbsp;|&nbsp;
                  <strong>Mandatory:</strong> Yes/No, True/False, 1/0, Y/N
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>💡 Tip:</strong> Column headers are matched flexibly — "Employee", "Name", "Learner", or "Participant" all work for the employee name column. The system adapts to common variations.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
