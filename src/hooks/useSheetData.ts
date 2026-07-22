import { useState, useEffect, useCallback, useRef } from 'react';
import type { TrainingRecord } from '../data/sampleData';
import { fetchGoogleSheet, parseCSV, csvToTrainingRecords } from '../data/googleSheets';
import { generateTrainingRecords } from '../data/sampleData';

export type DataSourceType = 'sample' | 'google-sheet' | 'csv-file';

export interface DataSourceState {
  type: DataSourceType;
  records: TrainingRecord[];
  loading: boolean;
  error: string | null;
  warnings: string[];
  sheetUrl: string;
  lastFetched: Date | null;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

const STORAGE_KEY = 'ld-dashboard-datasource';

interface SavedConfig {
  type: DataSourceType;
  sheetUrl: string;
  autoRefresh: boolean;
  refreshInterval: number;
}

function loadSavedConfig(): SavedConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        type: parsed.type || 'sample',
        sheetUrl: parsed.sheetUrl || '',
        autoRefresh: parsed.autoRefresh ?? true,
        refreshInterval: parsed.refreshInterval || 60,
      };
    }
  } catch { /* ignore */ }
  return { type: 'sample', sheetUrl: '', autoRefresh: true, refreshInterval: 60 };
}

function saveConfig(config: SavedConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// Generate sample data once
const sampleRecords = generateTrainingRecords(250);

export function useSheetData() {
  const savedConfig = loadSavedConfig();

  const [state, setState] = useState<DataSourceState>({
    type: savedConfig.type,
    records: sampleRecords,
    loading: false,
    error: null,
    warnings: [],
    sheetUrl: savedConfig.sheetUrl,
    lastFetched: null,
    autoRefresh: savedConfig.autoRefresh,
    refreshInterval: savedConfig.refreshInterval,
  });

  // Use refs for values read inside callbacks/intervals to avoid stale closures
  const stateRef = useRef(state);
  stateRef.current = state;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFromSheet = useCallback(async (url: string, silent = false) => {
    if (!url.trim()) return;

    if (!silent) {
      setState(prev => ({ ...prev, loading: true, error: null, warnings: [] }));
    }

    try {
      const csvText = await fetchGoogleSheet(url);
      const rows = parseCSV(csvText);
      const { records, warnings } = csvToTrainingRecords(rows);

      if (records.length === 0) {
        throw new Error('No data rows found. Make sure your spreadsheet has at least a header row and one data row.');
      }

      setState(prev => {
        const newState = {
          ...prev,
          type: 'google-sheet' as DataSourceType,
          records,
          loading: false,
          error: null,
          warnings,
          sheetUrl: url,
          lastFetched: new Date(),
        };
        saveConfig({
          type: 'google-sheet',
          sheetUrl: url,
          autoRefresh: prev.autoRefresh,
          refreshInterval: prev.refreshInterval,
        });
        return newState;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch spreadsheet';
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const loadCSVFile = useCallback((csvText: string, fileName: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, warnings: [] }));

    try {
      const rows = parseCSV(csvText);
      const { records, warnings } = csvToTrainingRecords(rows);

      if (records.length === 0) {
        throw new Error('No data rows found in the CSV file.');
      }

      setState(prev => ({
        ...prev,
        type: 'csv-file',
        records,
        loading: false,
        error: null,
        warnings: [`Loaded ${records.length} records from "${fileName}"`, ...warnings],
        sheetUrl: '',
        lastFetched: new Date(),
      }));

      saveConfig({ type: 'csv-file', sheetUrl: '', autoRefresh: false, refreshInterval: 60 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse CSV file';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  const switchToSample = useCallback(() => {
    setState(prev => ({
      ...prev,
      type: 'sample',
      records: sampleRecords,
      loading: false,
      error: null,
      warnings: [],
      sheetUrl: '',
      lastFetched: null,
    }));
    saveConfig({ type: 'sample', sheetUrl: '', autoRefresh: true, refreshInterval: 60 });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearWarnings = useCallback(() => {
    setState(prev => ({ ...prev, warnings: [] }));
  }, []);

  const setAutoRefresh = useCallback((enabled: boolean) => {
    setState(prev => {
      const newState = { ...prev, autoRefresh: enabled };
      saveConfig({
        type: prev.type,
        sheetUrl: prev.sheetUrl,
        autoRefresh: enabled,
        refreshInterval: prev.refreshInterval,
      });
      return newState;
    });
  }, []);

  const setRefreshInterval = useCallback((seconds: number) => {
    setState(prev => {
      const newState = { ...prev, refreshInterval: seconds };
      saveConfig({
        type: prev.type,
        sheetUrl: prev.sheetUrl,
        autoRefresh: prev.autoRefresh,
        refreshInterval: seconds,
      });
      return newState;
    });
  }, []);

  // Auto-refresh polling — uses stateRef to avoid stale closure
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (state.type === 'google-sheet' && state.autoRefresh && state.sheetUrl) {
      intervalRef.current = setInterval(() => {
        const current = stateRef.current;
        if (current.sheetUrl) {
          fetchFromSheet(current.sheetUrl, true);
        }
      }, state.refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.type, state.autoRefresh, state.sheetUrl, state.refreshInterval, fetchFromSheet]);

  // Auto-connect on mount if saved config has a sheet URL
  useEffect(() => {
    if (savedConfig.type === 'google-sheet' && savedConfig.sheetUrl) {
      fetchFromSheet(savedConfig.sheetUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    const current = stateRef.current;
    if (current.sheetUrl) {
      fetchFromSheet(current.sheetUrl);
    }
  }, [fetchFromSheet]);

  return {
    ...state,
    fetchFromSheet,
    loadCSVFile,
    switchToSample,
    setAutoRefresh,
    setRefreshInterval,
    clearError,
    clearWarnings,
    refresh,
  };
}
