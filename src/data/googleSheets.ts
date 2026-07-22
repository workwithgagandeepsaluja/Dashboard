import type { TrainingRecord } from './sampleData';

/**
 * Converts a Google Sheets sharing URL to its CSV export URL.
 *
 * Supported formats:
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/pub...
 *   Just the SPREADSHEET_ID
 *
 * You can also append ?gid=SHEET_GID to target a specific tab.
 */
export function toGoogleCsvUrl(input: string): string | null {
  const trimmed = input.trim();

  // Already a CSV export URL
  if (trimmed.includes('/export?') && trimmed.includes('format=csv')) {
    return trimmed;
  }

  // Already a published CSV URL (pub?output=csv)
  if (trimmed.includes('/pub') && trimmed.includes('output=csv')) {
    return trimmed;
  }

  // Extract spreadsheet ID from full URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const id = match[1];
    // Check for gid parameter
    const gidMatch = trimmed.match(/gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }

  // Maybe it's just a raw ID (alphanumeric + hyphens + underscores, 20+ chars)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return `https://docs.google.com/spreadsheets/d/${trimmed}/export?format=csv&gid=0`;
  }

  return null;
}

/**
 * Parse a CSV string into rows of key-value objects.
 * Handles quoted fields, embedded commas, and newlines within quotes.
 */
export function parseCSV(csv: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip \r
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0].trim() === '')) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Column name mapping — maps common header variations to our canonical field names.
 */
const COLUMN_MAP: Record<string, keyof TrainingRecord> = {
  // id
  'id': 'id',
  '#': 'id',
  'no': 'id',
  'number': 'id',
  'row': 'id',
  'sr': 'id',
  'sr.': 'id',
  'sl': 'id',

  // employeeName
  'employee name': 'employeeName',
  'employee': 'employeeName',
  'employeename': 'employeeName',
  'name': 'employeeName',
  'learner': 'employeeName',
  'learner name': 'employeeName',
  'full name': 'employeeName',
  'participant': 'employeeName',

  // department
  'department': 'department',
  'dept': 'department',
  'dept.': 'department',
  'team': 'department',
  'division': 'department',
  'business unit': 'department',

  // courseName
  'course name': 'courseName',
  'coursename': 'courseName',
  'course': 'courseName',
  'training': 'courseName',
  'training name': 'courseName',
  'program': 'courseName',
  'program name': 'courseName',
  'module': 'courseName',

  // category
  'category': 'category',
  'type': 'category',
  'training type': 'category',
  'course type': 'category',
  'training category': 'category',

  // status
  'status': 'status',
  'completion status': 'status',
  'training status': 'status',
  'progress': 'status',

  // completionDate
  'completion date': 'completionDate',
  'completiondate': 'completionDate',
  'completed on': 'completionDate',
  'completed date': 'completionDate',
  'date completed': 'completionDate',
  'finish date': 'completionDate',

  // enrollmentDate
  'enrollment date': 'enrollmentDate',
  'enrollmentdate': 'enrollmentDate',
  'enrolled on': 'enrollmentDate',
  'enrolled date': 'enrollmentDate',
  'enroll date': 'enrollmentDate',
  'start date': 'enrollmentDate',
  'date enrolled': 'enrollmentDate',
  'registration date': 'enrollmentDate',

  // score
  'score': 'score',
  'assessment score': 'score',
  'test score': 'score',
  'grade': 'score',
  'marks': 'score',
  'result': 'score',
  'score (%)': 'score',
  'score(%)': 'score',

  // timeSpent
  'time spent': 'timeSpent',
  'timespent': 'timeSpent',
  'hours': 'timeSpent',
  'time (hours)': 'timeSpent',
  'training hours': 'timeSpent',
  'duration': 'timeSpent',
  'hours spent': 'timeSpent',
  'time spent (hours)': 'timeSpent',

  // mandatory
  'mandatory': 'mandatory',
  'required': 'mandatory',
  'is mandatory': 'mandatory',
  'compulsory': 'mandatory',
};

/**
 * Resolve a raw header to a canonical field name.
 */
function resolveColumn(header: string): keyof TrainingRecord | null {
  const normalized = header.toLowerCase().trim();
  return COLUMN_MAP[normalized] || null;
}

/**
 * Parse a date string in various formats to yyyy-MM-dd.
 */
function parseDate(value: string): string | null {
  if (!value || value === '-' || value === 'N/A' || value === '') return null;

  // Already yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // MM/DD/YYYY or M/D/YYYY
  const mdy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  }

  // DD-MM-YYYY
  const dmy = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // Try native Date parsing as last resort
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return null;
}

function parseStatus(value: string): TrainingRecord['status'] {
  const v = value.toLowerCase().trim();

  // Direct match first (most reliable)
  const statusMap: Record<string, TrainingRecord['status']> = {
    'completed': 'Completed',
    'in progress': 'In Progress',
    'not started': 'Not Started',
    'overdue': 'Overdue',
  };
  if (statusMap[v]) return statusMap[v];

  // Check "not started" before "started" to avoid false positive
  if (v.includes('not started') || v.includes('not begun') || v.includes('pending')) return 'Not Started';
  if (v.includes('complet')) return 'Completed';
  if (v.includes('progress') || v.includes('ongoing') || v.includes('in-progress')) return 'In Progress';
  if (v.includes('overdue') || v.includes('expired') || v.includes('late') || v.includes('past due')) return 'Overdue';
  if (v.includes('enrolled') || v === 'new') return 'Not Started';

  return 'Not Started';
}

function parseBool(value: string): boolean {
  const v = value.toLowerCase().trim();
  return v === 'true' || v === 'yes' || v === '1' || v === 'y';
}

/**
 * Transform parsed CSV rows into TrainingRecord objects.
 * Flexibly maps column names and handles missing data gracefully.
 */
export function csvToTrainingRecords(rows: Record<string, string>[]): {
  records: TrainingRecord[];
  warnings: string[];
  unmappedColumns: string[];
} {
  if (rows.length === 0) return { records: [], warnings: [], unmappedColumns: [] };

  const headers = Object.keys(rows[0]);
  const columnMapping: Record<string, keyof TrainingRecord> = {};
  const unmappedColumns: string[] = [];

  headers.forEach(h => {
    const field = resolveColumn(h);
    if (field) {
      columnMapping[h] = field;
    } else {
      unmappedColumns.push(h);
    }
  });

  const warnings: string[] = [];

  // Check required fields
  const mappedFields = new Set(Object.values(columnMapping));
  if (!mappedFields.has('employeeName') && !mappedFields.has('courseName')) {
    warnings.push('Could not find "Employee Name" or "Course Name" columns. Please check your column headers.');
  }

  const records: TrainingRecord[] = [];

  rows.forEach((row, idx) => {
    const getValue = (field: keyof TrainingRecord): string => {
      const header = Object.keys(columnMapping).find(h => columnMapping[h] === field);
      return header ? (row[header] || '') : '';
    };

    const enrollmentDateRaw = getValue('enrollmentDate');
    const completionDateRaw = getValue('completionDate');
    const scoreRaw = getValue('score');
    const timeRaw = getValue('timeSpent');
    const statusRaw = getValue('status');
    const idRaw = getValue('id');

    const enrollmentDate = parseDate(enrollmentDateRaw) || '2025-01-01';
    const completionDate = parseDate(completionDateRaw);
    const score = scoreRaw ? parseFloat(scoreRaw.replace('%', '')) : null;
    const timeSpent = timeRaw ? parseFloat(timeRaw) : 0;

    records.push({
      id: idRaw ? parseInt(idRaw) || (idx + 1) : (idx + 1),
      employeeName: getValue('employeeName') || `Employee ${idx + 1}`,
      department: getValue('department') || 'General',
      courseName: getValue('courseName') || `Course ${idx + 1}`,
      category: getValue('category') || 'General',
      status: statusRaw ? parseStatus(statusRaw) : 'Not Started',
      completionDate: completionDate,
      enrollmentDate: enrollmentDate,
      score: isNaN(score as number) ? null : score,
      timeSpent: isNaN(timeSpent) ? 0 : timeSpent,
      mandatory: parseBool(getValue('mandatory') || 'false'),
    });
  });

  if (unmappedColumns.length > 0) {
    warnings.push(`Unmapped columns (ignored): ${unmappedColumns.join(', ')}`);
  }

  return { records, warnings, unmappedColumns };
}

// ─── CORS Proxy Fallback System ───────────────────────────────────────────────
// When running locally (file://) or on GitHub Pages, Google Sheets blocks direct
// fetch() due to CORS. We try multiple free CORS proxy services as fallbacks.

const CORS_PROXIES = [
  {
    name: 'Direct',
    buildUrl: (url: string) => url,
  },
  {
    name: 'AllOrigins',
    buildUrl: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'corsproxy.io',
    buildUrl: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  },
  {
    name: 'CodeTabs',
    buildUrl: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  },
  {
    name: 'ThingProxy',
    buildUrl: (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  },
];

const PROXY_PREF_KEY = 'ld-dashboard-working-proxy';

function getPreferredProxy(): number {
  try {
    const saved = localStorage.getItem(PROXY_PREF_KEY);
    if (saved !== null) {
      const idx = parseInt(saved);
      if (idx >= 0 && idx < CORS_PROXIES.length) return idx;
    }
  } catch { /* ignore */ }
  return 0;
}

function savePreferredProxy(idx: number) {
  try {
    localStorage.setItem(PROXY_PREF_KEY, String(idx));
  } catch { /* ignore */ }
}

/**
 * Validate that the response text looks like valid CSV data, not HTML error page.
 */
function isValidCSV(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return false;
  // Must have at least one comma or newline (basic CSV structure)
  return trimmed.includes(',') || trimmed.includes('\n');
}

/**
 * Fetch CSV from a Google Sheets URL.
 * Uses a CORS proxy fallback chain: tries direct first, then multiple proxy services.
 * Remembers which proxy worked for faster subsequent fetches.
 */
export async function fetchGoogleSheet(url: string): Promise<string> {
  const csvUrl = toGoogleCsvUrl(url);
  if (!csvUrl) {
    throw new Error('Invalid Google Sheets URL. Please use a sharing link like:\nhttps://docs.google.com/spreadsheets/d/YOUR_ID/edit');
  }

  // Start with the last-known working proxy for faster response
  const preferredIdx = getPreferredProxy();
  const proxyOrder = [preferredIdx, ...CORS_PROXIES.map((_, i) => i).filter(i => i !== preferredIdx)];

  const errors: string[] = [];

  for (const proxyIdx of proxyOrder) {
    const proxy = CORS_PROXIES[proxyIdx];
    const fetchUrl = proxy.buildUrl(csvUrl);

    try {
      const response = await fetch(fetchUrl, {
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        // Special handling for common status codes
        if (response.status === 404) {
          throw new Error('Spreadsheet not found. Check the URL is correct.');
        }
        if (response.status === 403 || response.status === 401) {
          throw new Error(`Access denied via ${proxy.name}. Share the sheet as "Anyone with the link → Viewer".`);
        }
        throw new Error(`HTTP ${response.status} from ${proxy.name}`);
      }

      const text = await response.text();

      if (!isValidCSV(text)) {
        throw new Error(`${proxy.name} returned HTML instead of CSV. The sheet may not be shared publicly.`);
      }

      // Success! Remember this proxy for next time
      if (proxyIdx !== preferredIdx) {
        savePreferredProxy(proxyIdx);
      }

      return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed via ${proxy.name}`;
      errors.push(`${proxy.name}: ${msg}`);
      continue; // try next proxy
    }
  }

  // All proxies failed — provide a helpful error message
  throw new Error(
    `Could not fetch the spreadsheet. Tried ${CORS_PROXIES.length} connection methods.\n\n` +
    `Please verify:\n` +
    `1. The sheet is shared as "Anyone with the link → Viewer"\n` +
    `2. The URL is correct\n` +
    `3. The sheet has data in it\n\n` +
    `Alternatively, download the sheet as a .csv file and use the "Upload CSV" option.`
  );
}

const TEMPLATE_HEADERS = [
  'Employee Name', 'Department', 'Course Name', 'Category', 'Status',
  'Enrollment Date', 'Completion Date', 'Score', 'Time Spent (Hours)', 'Mandatory'
];

/**
 * Generate a blank template CSV — headers only, ready for the user to fill in.
 */
export function generateBlankTemplateCSV(): string {
  return TEMPLATE_HEADERS.join(',');
}

/**
 * Generate a 50-record sample spreadsheet CSV with realistic L&D training data.
 * Covers all departments, categories, statuses, date ranges, and score distributions.
 */
export function generateSampleDataCSV(): string {
  const rows = [
    // ── Engineering ─────────────────────────────────────────────
    ['Aarav Mehta',     'Engineering',        'Advanced Python Programming',      'Technical Skills',  'Completed',   '2025-01-10', '2025-02-05', '94', '18.5', 'Yes'],
    ['Priya Sharma',    'Engineering',        'Cloud Architecture (AWS)',          'Technical Skills',  'Completed',   '2025-02-01', '2025-03-12', '87', '24.0', 'Yes'],
    ['Rohan Gupta',     'Engineering',        'Cybersecurity Fundamentals',        'Technical Skills',  'In Progress', '2025-03-15', '',           '',   '8.0',  'Yes'],
    ['Sneha Patel',     'Engineering',        'Data Privacy Fundamentals',         'Compliance',        'Completed',   '2025-01-05', '2025-01-12', '96', '3.0',  'Yes'],
    ['Vikram Singh',    'Engineering',        'React & TypeScript Mastery',        'Technical Skills',  'Not Started', '2025-04-01', '',           '',   '0',    'Yes'],
    ['Ananya Reddy',    'Engineering',        'Effective Communication',           'Soft Skills',       'Completed',   '2025-01-20', '2025-02-15', '82', '6.5',  'No'],
    ['Karthik Nair',    'Engineering',        'Data Engineering Pipeline',         'Technical Skills',  'Overdue',     '2024-11-01', '',           '',   '2.0',  'Yes'],

    // ── Sales ───────────────────────────────────────────────────
    ['Jordan Brooks',   'Sales',              'Product Suite Overview 2025',       'Product Training',  'Completed',   '2025-01-08', '2025-01-22', '91', '10.0', 'Yes'],
    ['Taylor Kim',      'Sales',              'Demo & Pitch Training',             'Product Training',  'Completed',   '2025-02-10', '2025-03-01', '88', '8.5',  'Yes'],
    ['Morgan Chen',     'Sales',              'Customer Use Cases',                'Product Training',  'In Progress', '2025-03-05', '',           '',   '5.0',  'Yes'],
    ['Casey Williams',  'Sales',              'Conflict Resolution',               'Soft Skills',       'Completed',   '2025-01-15', '2025-02-08', '79', '4.5',  'No'],
    ['Riley Johnson',   'Sales',              'Competitive Landscape',             'Product Training',  'Not Started', '2025-04-15', '',           '',   '0',    'No'],
    ['Quinn Martinez',  'Sales',              'Anti-Harassment Training',          'Compliance',        'Completed',   '2025-01-03', '2025-01-08', '95', '2.5',  'Yes'],

    // ── Marketing ───────────────────────────────────────────────
    ['Emma Watson',     'Marketing',          'Presentation Skills Pro',           'Soft Skills',       'Completed',   '2025-01-18', '2025-02-20', '90', '7.0',  'No'],
    ['Liam O\'Brien',   'Marketing',          'Unconscious Bias Awareness',        'DEI',               'Completed',   '2025-02-01', '2025-02-10', '85', '3.5',  'Yes'],
    ['Sophie Laurent',  'Marketing',          'Product Suite Overview 2025',       'Product Training',  'In Progress', '2025-03-20', '',           '',   '3.0',  'Yes'],
    ['Noah Fernandez',  'Marketing',          'Effective Communication',           'Soft Skills',       'Not Started', '2025-04-10', '',           '',   '0',    'No'],
    ['Isabella Rossi',  'Marketing',          'Data Privacy Fundamentals',         'Compliance',        'Overdue',     '2024-12-01', '',           '',   '1.0',  'Yes'],

    // ── HR ──────────────────────────────────────────────────────
    ['Sarah Mitchell',  'HR',                 'Anti-Harassment Training',          'Compliance',        'Completed',   '2025-01-02', '2025-01-07', '97', '2.5',  'Yes'],
    ['David Park',      'HR',                 'Coaching for Managers',             'Leadership',        'Completed',   '2025-01-15', '2025-02-28', '93', '14.0', 'Yes'],
    ['Maria Garcia',    'HR',                 'Inclusive Leadership',               'DEI',               'Completed',   '2025-02-05', '2025-02-20', '89', '5.5',  'Yes'],
    ['James Thompson',  'HR',                 'Change Management',                 'Leadership',        'In Progress', '2025-03-10', '',           '',   '6.0',  'Yes'],
    ['Aisha Mohammed',  'HR',                 'Code of Conduct 2025',              'Compliance',        'Completed',   '2025-01-03', '2025-01-10', '98', '3.0',  'Yes'],

    // ── Finance ─────────────────────────────────────────────────
    ['Michael Chen',    'Finance',            'SOX Compliance Essentials',         'Compliance',        'Completed',   '2025-01-06', '2025-01-20', '91', '5.0',  'Yes'],
    ['Rachel Kim',      'Finance',            'GDPR Compliance',                   'Compliance',        'In Progress', '2025-03-01', '',           '',   '2.5',  'Yes'],
    ['Thomas Anderson', 'Finance',            'Time Management Mastery',           'Soft Skills',       'Completed',   '2025-01-10', '2025-02-01', '84', '4.0',  'No'],
    ['Olivia Brown',    'Finance',            'Data Privacy Fundamentals',         'Compliance',        'Not Started', '2025-04-01', '',           '',   '0',    'Yes'],
    ['Ethan Davis',     'Finance',            'Leading High-Performance Teams',    'Leadership',        'Overdue',     '2024-10-15', '',           '',   '3.0',  'Yes'],

    // ── Operations ──────────────────────────────────────────────
    ['Chris Johnson',   'Operations',         'Workplace Safety Standards',        'Safety',            'Completed',   '2025-01-04', '2025-01-10', '93', '2.0',  'Yes'],
    ['Nina Petrov',     'Operations',         'Emergency Response Protocol',       'Safety',            'Completed',   '2025-01-15', '2025-01-20', '90', '2.5',  'Yes'],
    ['Ahmed Hassan',    'Operations',         'Ergonomics Best Practices',         'Safety',            'In Progress', '2025-02-20', '',           '',   '1.5',  'Yes'],
    ['Julia Santos',    'Operations',         'Fire Safety Training',              'Safety',            'Completed',   '2025-01-08', '2025-01-12', '88', '1.5',  'Yes'],
    ['Mark Wilson',     'Operations',         'First Aid Certification',           'Safety',            'Not Started', '2025-04-01', '',           '',   '0',    'Yes'],
    ['Fatima Al-Rashid','Operations',         'Anti-Harassment Training',          'Compliance',        'Completed',   '2025-01-03', '2025-01-09', '95', '2.5',  'Yes'],
    ['Derek Foster',    'Operations',         'Effective Communication',           'Soft Skills',       'Overdue',     '2024-12-10', '',           '',   '0.5',  'No'],

    // ── Product ─────────────────────────────────────────────────
    ['Alex Rivera',     'Product',            'Strategic Decision Making',         'Leadership',        'Completed',   '2025-01-20', '2025-03-05', '92', '16.0', 'Yes'],
    ['Sam Nakamura',    'Product',            'Product Suite Overview 2025',       'Product Training',  'Completed',   '2025-02-01', '2025-02-15', '86', '8.0',  'Yes'],
    ['Jamie O\'Connor', 'Product',            'New Feature Deep Dive Q1',          'Product Training',  'In Progress', '2025-03-10', '',           '',   '5.5',  'Yes'],
    ['Patricia Herrera','Product',            'Cultural Competency',               'DEI',               'Completed',   '2025-01-25', '2025-02-08', '83', '4.0',  'No'],
    ['Wei Zhang',       'Product',            'Accessible Design Principles',      'DEI',               'Not Started', '2025-04-20', '',           '',   '0',    'No'],

    // ── Customer Support ────────────────────────────────────────
    ['Lisa Chang',      'Customer Support',   'Product Suite Overview 2025',       'Product Training',  'Completed',   '2025-01-05', '2025-01-20', '89', '9.0',  'Yes'],
    ['Ryan O\'Donnell', 'Customer Support',   'Emotional Intelligence',            'Soft Skills',       'Completed',   '2025-01-15', '2025-02-10', '91', '5.5',  'Yes'],
    ['Amanda Foster',   'Customer Support',   'Conflict Resolution',               'Soft Skills',       'Completed',   '2025-02-01', '2025-02-25', '87', '5.0',  'No'],
    ['Brandon Lee',     'Customer Support',   'Customer Use Cases',                'Product Training',  'In Progress', '2025-03-15', '',           '',   '4.0',  'Yes'],
    ['Destiny Johnson', 'Customer Support',   'Company Culture & Values',          'Onboarding',        'Completed',   '2025-01-02', '2025-01-05', '94', '2.0',  'Yes'],
    ['Marcus Williams', 'Customer Support',   'Anti-Harassment Training',          'Compliance',        'Overdue',     '2024-11-20', '',           '',   '1.0',  'Yes'],
    ['Hannah Berg',     'Customer Support',   'Allyship in the Workplace',         'DEI',               'Not Started', '2025-04-05', '',           '',   '0',    'No'],
    ['Tyler Morrison',  'Customer Support',   'Demo & Pitch Training',             'Product Training',  'Completed',   '2025-02-10', '2025-03-01', '78', '7.5',  'No'],

    // ── Onboarding examples ─────────────────────────────────────
    ['Grace Liu',       'Engineering',        'Company Culture & Values',          'Onboarding',        'Completed',   '2025-03-01', '2025-03-03', '100','1.5',  'Yes'],
    ['Evan Carter',     'Sales',              'Systems & Tools Setup',             'Onboarding',        'Completed',   '2025-03-01', '2025-03-04', '95', '2.0',  'Yes'],
    ['Zara Hussain',    'Marketing',          'Role-Specific Orientation',         'Onboarding',        'In Progress', '2025-03-15', '',           '',   '1.0',  'Yes'],
    ['Jake Phillips',   'Customer Support',   'Benefits & Policies Overview',      'Onboarding',        'Completed',   '2025-03-01', '2025-03-02', '90', '1.0',  'Yes'],
    ['Mia Tanaka',      'Finance',            'First 90 Days Roadmap',             'Onboarding',        'In Progress', '2025-03-10', '',           '',   '3.0',  'Yes'],
  ];

  return [TEMPLATE_HEADERS.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generate a small inline template CSV (5 rows) for quick copy-paste.
 */
export function generateTemplateCSV(): string {
  const rows = [
    ['Jane Smith', 'Engineering', 'React & TypeScript Mastery', 'Technical Skills', 'Completed', '2025-01-15', '2025-02-10', '92', '12.5', 'Yes'],
    ['John Doe', 'Sales', 'Product Suite Overview 2025', 'Product Training', 'In Progress', '2025-02-01', '', '', '4.0', 'Yes'],
    ['Alice Johnson', 'HR', 'Anti-Harassment Training', 'Compliance', 'Completed', '2025-01-20', '2025-01-25', '88', '3.0', 'Yes'],
    ['Bob Williams', 'Marketing', 'Effective Communication', 'Soft Skills', 'Not Started', '2025-03-01', '', '', '0', 'No'],
    ['Carol Davis', 'Finance', 'SOX Compliance Essentials', 'Compliance', 'Overdue', '2024-11-15', '', '', '1.5', 'Yes'],
  ];

  return [TEMPLATE_HEADERS.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generate a download URL for the current standalone HTML page.
 * Returns null if not available.
 */
export function downloadStandaloneHTML(): void {
  const html = document.documentElement.outerHTML;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'L&D_Training_Dashboard.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
