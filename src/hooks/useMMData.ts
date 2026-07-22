import { useState, useEffect, useCallback, useRef } from 'react';
import type { MMDashboardData } from '../data/mmData';
import { parseMMSheet, generateSampleMMData } from '../data/mmData';
import { fetchGoogleSheet, parseCSV } from '../data/googleSheets';

const STORAGE_KEY = 'ld-dashboard-mm-sheet';

interface SavedMMConfig {
  sheetUrl: string;
  autoRefresh: boolean;
  refreshInterval: number;
}

function loadConfig(): SavedMMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        sheetUrl: p.sheetUrl || '',
        autoRefresh: p.autoRefresh ?? true,
        refreshInterval: p.refreshInterval || 120,
      };
    }
  } catch { /* ignore */ }
  return { sheetUrl: '', autoRefresh: true, refreshInterval: 120 };
}

function saveConfig(config: SavedMMConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useMMData() {
  const saved = loadConfig();

  const [state, setState] = useState<{
    data: MMDashboardData;
    loading: boolean;
    error: string | null;
    sheetUrl: string;
    lastFetched: Date | null;
    autoRefresh: boolean;
    refreshInterval: number;
    mode: 'sample' | 'sheet';
  }>({
    data: generateSampleMMData(),
    loading: false,
    error: null,
    sheetUrl: saved.sheetUrl,
    lastFetched: null,
    autoRefresh: saved.autoRefresh,
    refreshInterval: saved.refreshInterval,
    mode: saved.sheetUrl ? 'sheet' : 'sample',
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Fetch multi-tab Google Sheet.
   * Google Sheets CSV export fetches one tab per URL (gid param).
   * We try multiple gid's (0-10) to discover all tabs.
   */
  const fetchSheet = useCallback(async (url: string, silent = false) => {
    if (!url.trim()) return;

    if (!silent) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const sheetData: Record<string, Record<string, string>[]> = {};
      const gidRegex = /gid=(\d+)/;
      const baseMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);

      if (!baseMatch) {
        throw new Error('Invalid Google Sheets URL');
      }

      const spreadsheetId = baseMatch[1];
      const existingGid = url.match(gidRegex)?.[1] || '0';

      // Try to fetch multiple gids (tabs) in parallel
      const gidPromises = Array.from({ length: 12 }, (_, i) => {
        const gid = i === 0 ? existingGid : String(i * 100 + (i > 0 ? 99 : 0));
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
        return fetchGoogleSheet(csvUrl)
          .then(csv => {
            const rows = parseCSV(csv);
            if (rows.length > 0) {
              const headers = Object.keys(rows[0]);
              // Use first cell of first row as tab name, or "Sheet X"
              const tabName = headers[0] && rows[0][headers[0]] ? rows[0][headers[0]] : `Sheet ${i + 1}`;
              return { tabName, rows, gid, headers };
            }
            return null;
          })
          .catch(() => null);
      });

      const results = await Promise.allSettled(gidPromises);
      let foundTabs = 0;

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          const { tabName, rows } = result.value;
          const firstRowValues = Object.values(rows[0]);

          // Check if first row is actually data (not headers)
          const looksLikeData = firstRowValues.some(v =>
            v.includes('/') || v.includes('-') || !isNaN(Number(v))
          );

          if (looksLikeData || rows.length === 1) {
            // First row is data — treat as "NPS" type sheet
            sheetData[tabName || 'Data'] = rows;
          } else {
            sheetData[tabName || `Sheet ${foundTabs + 1}`] = rows.slice(1); // skip header row if first row is headers
          }
          foundTabs++;
        }
      });

      if (foundTabs === 0) {
        // Fallback: try fetching as single sheet
        const csv = await fetchGoogleSheet(url);
        const rows = parseCSV(csv);
        if (rows.length > 0) {
          // Try to detect section boundaries within the single sheet
          const sections = splitSingleSheet(rows);
          Object.assign(sheetData, sections);
        }
      }

      const parsed = parseMMSheet(sheetData);

      if (Object.keys(sheetData).length === 0) {
        throw new Error('No data found in the spreadsheet. Make sure it has data and is shared publicly.');
      }

      setState(prev => ({
        ...prev,
        data: parsed,
        loading: false,
        error: null,
        sheetUrl: url,
        lastFetched: new Date(),
        mode: 'sheet',
      }));

      saveConfig({
        sheetUrl: url,
        autoRefresh: stateRef.current.autoRefresh,
        refreshInterval: stateRef.current.refreshInterval,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch MM data';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  /**
   * When there's only one CSV tab, try to split it into sections
   * by detecting "section header" rows (rows where all cells after
   * the first are empty).
   */
  function splitSingleSheet(rows: Record<string, string>[]): Record<string, Record<string, string>[]> {
    const sections: Record<string, Record<string, string>[]> = {};
    let currentSection = 'Main';
    let currentRows: Record<string, string>[] = [];

    for (const row of rows) {
      const values = Object.values(row);
      const nonEmpty = values.filter(v => v && v.trim());

      // If only one cell has content, treat as section header
      if (nonEmpty.length === 1 && nonEmpty[0] === Object.values(row)[0]) {
        if (currentRows.length > 0) {
          sections[currentSection] = currentRows;
        }
        currentSection = nonEmpty[0];
        currentRows = [];
      } else {
        currentRows.push(row);
      }
    }

    if (currentRows.length > 0) {
      sections[currentSection] = currentRows;
    }

    return sections;
  }

  const switchToSample = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: generateSampleMMData(),
      loading: false,
      error: null,
      sheetUrl: '',
      lastFetched: null,
      mode: 'sample',
    }));
    saveConfig({ sheetUrl: '', autoRefresh: true, refreshInterval: 120 });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setAutoRefresh = useCallback((enabled: boolean) => {
    setState(prev => {
      saveConfig({ sheetUrl: prev.sheetUrl, autoRefresh: enabled, refreshInterval: prev.refreshInterval });
      return { ...prev, autoRefresh: enabled };
    });
  }, []);

  const setRefreshInterval = useCallback((seconds: number) => {
    setState(prev => {
      saveConfig({ sheetUrl: prev.sheetUrl, autoRefresh: prev.autoRefresh, refreshInterval: seconds });
      return { ...prev, refreshInterval: seconds };
    });
  }, []);

  const refresh = useCallback(() => {
    const current = stateRef.current;
    if (current.sheetUrl) fetchSheet(current.sheetUrl);
  }, [fetchSheet]);

  // Auto-refresh polling
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (state.mode === 'sheet' && state.autoRefresh && state.sheetUrl) {
      intervalRef.current = setInterval(() => {
        const current = stateRef.current;
        if (current.sheetUrl) fetchSheet(current.sheetUrl, true);
      }, state.refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.mode, state.autoRefresh, state.sheetUrl, state.refreshInterval, fetchSheet]);

  // Auto-connect on mount
  useEffect(() => {
    if (saved.sheetUrl) {
      fetchSheet(saved.sheetUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    fetchSheet,
    switchToSample,
    setAutoRefresh,
    setRefreshInterval,
    clearError,
    refresh,
  };
}
