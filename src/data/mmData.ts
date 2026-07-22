/**
 * Morning Meeting Data — types, parsing, and sample data.
 *
 * Expected Google Sheet structure (multiple tabs / gid's):
 *
 * Tab "NPS" (or first tab):
 *   Row 1 headers: Metric, MTD, YTD, Target, Trend
 *   Rows: NPS Score, Total Surveys, Response Rate, etc.
 *
 * Tab "Surveys" (or second tab):
 *   Row 1 headers: Category, Count, Percentage, MTD Count, YTD Count, Trend
 *   Rows: Promoters, Passives, Detractors
 *
 * Tab "Reviews" (or third tab):
 *   Row 1 headers: Platform, Rating, Review Count, MTD Reviews, YTD Reviews, Response Rate, Negative Count
 *   Rows: Google, TripAdvisor, Booking.com, etc.
 *
 * Tab "Feedback" (or fourth tab):
 *   Row 1 headers: Date, Guest Name, Platform, Category, Rating, Feedback, Sentiment, Status
 *   Rows: individual negative feedback entries
 *
 * Tab "LQA" (or fifth tab):
 *   Row 1 headers: Session, Date, Status, Score, Trainer, Notes
 *   Rows: individual LQA sessions
 *
 * Tab "Email" (or sixth tab):
 *   Row 1 headers: Metric, MTD, YTD, Target, Trend
 *   Rows: Bounce Rate, Open Rate, Total Sent, Bounced, etc.
 *
 * Any additional tabs are parsed as generic "custom sections" and rendered as tables.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MMDataSection {
  id: string;
  title: string;
  type: MMSectionType;
  rows: MMRawRow[];
  headers: string[];
}

export type MMSectionType =
  | 'nps'
  | 'surveys'
  | 'reviews'
  | 'feedback'
  | 'lqa'
  | 'email'
  | 'generic';

export interface MMRawRow {
  [key: string]: string;
}

export interface NPSData {
  score: { mtd: number; ytd: number };
  totalSurveys: { mtd: number; ytd: number };
  responseRate: { mtd: number; ytd: number };
  target: number;
  trend: number[];
  allMetrics: { metric: string; mtd: string; ytd: string; target: string }[];
}

export interface SurveyBreakdown {
  promoters: { count: number; pct: number; mtd: number; ytd: number };
  passives: { count: number; pct: number; mtd: number; ytd: number };
  detractors: { count: number; pct: number; mtd: number; ytd: number };
  total: number;
  allRows: MMRawRow[];
}

export interface PlatformReview {
  platform: string;
  rating: number;
  reviewCount: number;
  mtdReviews: number;
  ytdReviews: number;
  responseRate: number;
  negativeCount: number;
}

export interface FeedbackEntry {
  date: string;
  guestName: string;
  platform: string;
  category: string;
  rating: string;
  feedback: string;
  sentiment: string;
  status: string;
}

export interface LQASession {
  session: string;
  date: string;
  status: string;
  score: number | null;
  trainer: string;
  notes: string;
}

export interface EmailBounceData {
  bounceRate: { mtd: number; ytd: number };
  openRate: { mtd: number; ytd: number };
  totalSent: { mtd: number; ytd: number };
  bounced: { mtd: number; ytd: number };
  target: number;
  allMetrics: { metric: string; mtd: string; ytd: string; target: string }[];
}

export interface MMDashboardData {
  sections: MMDataSection[];
  nps: NPSData | null;
  surveys: SurveyBreakdown | null;
  reviews: PlatformReview[];
  negativeFeedback: FeedbackEntry[];
  allFeedback: FeedbackEntry[];
  lqaSessions: LQASession[];
  emailBounce: EmailBounceData | null;
  customSections: MMDataSection[];
  connected: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeNum(val: string | undefined, fallback = 0): number {
  if (!val) return fallback;
  const cleaned = val.replace(/[%,]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? fallback : n;
}

function safeStr(val: string | undefined, fallback = ''): string {
  return (val || fallback).trim();
}

function findCol(headers: string[], ...candidates: string[]): number {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx !== -1) return idx;
  }
  // fuzzy match
  for (const c of candidates) {
    const idx = lower.findIndex(h => h.includes(c.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

function getCell(row: MMRawRow, headers: string[], ...candidates: string[]): string {
  const idx = findCol(headers, ...candidates);
  if (idx === -1) return '';
  return row[headers[idx]] || '';
}

// ─── Section Type Detection ───────────────────────────────────────────────────

const SECTION_TYPE_MAP: { keywords: string[]; type: MMSectionType }[] = [
  { keywords: ['nps', 'net promoter', 'promoter score'], type: 'nps' },
  { keywords: ['survey', 'promoter', 'passive', 'detractor'], type: 'surveys' },
  { keywords: ['review', 'platform', 'tripadvisor', 'google review', 'booking'], type: 'reviews' },
  { keywords: ['feedback', 'negative', 'complaint', 'guest comment'], type: 'feedback' },
  { keywords: ['lqa', 'session', 'quality assurance'], type: 'lqa' },
  { keywords: ['email', 'bounce', 'open rate', 'deliverability'], type: 'email' },
];

function detectSectionType(title: string, headers: string[], rows: MMRawRow[]): MMSectionType {
  const titleLower = title.toLowerCase();
  const allHeaders = headers.join(' ').toLowerCase();
  const allText = titleLower + ' ' + allHeaders;

  for (const mapping of SECTION_TYPE_MAP) {
    const matchCount = mapping.keywords.filter(k => allText.includes(k)).length;
    if (matchCount >= 1) return mapping.type;
  }

  // Content-based fallback: check first column values
  const firstColValues = rows.map(r => Object.values(r)[0]?.toLowerCase() || '').join(' ');
  for (const mapping of SECTION_TYPE_MAP) {
    const matchCount = mapping.keywords.filter(k => firstColValues.includes(k)).length;
    if (matchCount >= 2) return mapping.type;
  }

  return 'generic';
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseNPS(section: MMDataSection): NPSData {
  const headers = section.headers;
  const rows = section.rows;

  const mtdIdx = findCol(headers, 'mtd', 'month');
  const ytdIdx = findCol(headers, 'ytd', 'year');
  const targetIdx = findCol(headers, 'target', 'goal');
  const metricIdx = findCol(headers, 'metric', 'name', 'label', 'kpi');
  const trendIdx = findCol(headers, 'trend');

  const allMetrics: NPSData['allMetrics'] = [];
  let scoreMtd = 0, scoreYtd = 0;
  let surveysMtd = 0, surveysYtd = 0;
  let rateMtd = 0, rateYtd = 0;
  let target = 50;
  const trend: number[] = [];

  rows.forEach(row => {
    const metric = safeStr(metricIdx >= 0 ? row[headers[metricIdx]] : Object.values(row)[0]);
    const mtd = safeStr(mtdIdx >= 0 ? row[headers[mtdIdx]] : '');
    const ytd = safeStr(ytdIdx >= 0 ? row[headers[ytdIdx]] : '');
    const tgt = safeStr(targetIdx >= 0 ? row[headers[targetIdx]] : '');

    allMetrics.push({ metric, mtd, ytd, target: tgt });

    const metricLower = metric.toLowerCase();
    if (metricLower.includes('nps') || metricLower.includes('net promoter') || metricLower === 'score') {
      scoreMtd = safeNum(mtd);
      scoreYtd = safeNum(ytd);
      if (tgt) target = safeNum(tgt);
    }
    if (metricLower.includes('survey') || metricLower.includes('total')) {
      surveysMtd = safeNum(mtd);
      surveysYtd = safeNum(ytd);
    }
    if (metricLower.includes('response') || metricLower.includes('rate')) {
      rateMtd = safeNum(mtd);
      rateYtd = safeNum(ytd);
    }

    // Parse trend data if present
    if (trendIdx >= 0) {
      const trendVal = row[headers[trendIdx]] || '';
      trendVal.split(',').forEach(v => {
        const n = safeNum(v.trim());
        if (n) trend.push(n);
      });
    }
  });

  // Fallback: if no explicit NPS row found, use first numeric row
  if (scoreMtd === 0 && scoreYtd === 0 && rows.length > 0) {
    scoreMtd = safeNum(mtdIdx >= 0 ? rows[0][headers[mtdIdx]] : '');
    scoreYtd = safeNum(ytdIdx >= 0 ? rows[0][headers[ytdIdx]] : '');
  }

  return {
    score: { mtd: scoreMtd, ytd: scoreYtd },
    totalSurveys: { mtd: surveysMtd, ytd: surveysYtd },
    responseRate: { mtd: rateMtd, ytd: rateYtd },
    target,
    trend: trend.length > 0 ? trend : [scoreMtd - 5, scoreMtd - 3, scoreMtd - 1, scoreMtd, scoreMtd + 1],
    allMetrics,
  };
}

function parseSurveys(section: MMDataSection): SurveyBreakdown {
  const headers = section.headers;
  const rows = section.rows;

  const countIdx = findCol(headers, 'count', 'number', 'total');
  const pctIdx = findCol(headers, 'percentage', 'percent', '%', 'pct');
  const mtdIdx = findCol(headers, 'mtd', 'month');
  const ytdIdx = findCol(headers, 'ytd', 'year');
  const catIdx = findCol(headers, 'category', 'type', 'name', 'label');

  const result: SurveyBreakdown = {
    promoters: { count: 0, pct: 0, mtd: 0, ytd: 0 },
    passives: { count: 0, pct: 0, mtd: 0, ytd: 0 },
    detractors: { count: 0, pct: 0, mtd: 0, ytd: 0 },
    total: 0,
    allRows: rows,
  };

  rows.forEach(row => {
    const cat = safeStr(catIdx >= 0 ? row[headers[catIdx]] : Object.values(row)[0]).toLowerCase();
    const count = safeNum(countIdx >= 0 ? row[headers[countIdx]] : '');
    const pct = safeNum(pctIdx >= 0 ? row[headers[pctIdx]] : '');
    const mtd = safeNum(mtdIdx >= 0 ? row[headers[mtdIdx]] : '');
    const ytd = safeNum(ytdIdx >= 0 ? row[headers[ytdIdx]] : '');

    if (cat.includes('promoter') && !cat.includes('net')) {
      result.promoters = { count: count || result.promoters.count, pct: pct || result.promoters.pct, mtd, ytd };
    } else if (cat.includes('passive')) {
      result.passives = { count: count || result.passives.count, pct: pct || result.passives.pct, mtd, ytd };
    } else if (cat.includes('detractor')) {
      result.detractors = { count: count || result.detractors.count, pct: pct || result.detractors.pct, mtd, ytd };
    }
  });

  result.total = result.promoters.count + result.passives.count + result.detractors.count;

  // Calculate percentages if not provided
  if (result.total > 0) {
    if (!result.promoters.pct) result.promoters.pct = Math.round((result.promoters.count / result.total) * 100);
    if (!result.passives.pct) result.passives.pct = Math.round((result.passives.count / result.total) * 100);
    if (!result.detractors.pct) result.detractors.pct = Math.round((result.detractors.count / result.total) * 100);
  }

  return result;
}

function parseReviews(section: MMDataSection): PlatformReview[] {
  const headers = section.headers;
  const rows = section.rows;

  return rows.map(row => ({
    platform: safeStr(getCell(row, headers, 'platform', 'name', 'source')),
    rating: safeNum(getCell(row, headers, 'rating', 'score', 'stars')),
    reviewCount: safeNum(getCell(row, headers, 'review count', 'count', 'total', 'reviews')),
    mtdReviews: safeNum(getCell(row, headers, 'mtd', 'mtd reviews', 'month')),
    ytdReviews: safeNum(getCell(row, headers, 'ytd', 'ytd reviews', 'year')),
    responseRate: safeNum(getCell(row, headers, 'response rate', 'response', 'reply rate')),
    negativeCount: safeNum(getCell(row, headers, 'negative', 'negative count', 'bad', 'complaints')),
  }));
}

function parseFeedback(section: MMDataSection): FeedbackEntry[] {
  const headers = section.headers;
  const rows = section.rows;

  return rows.map(row => ({
    date: safeStr(getCell(row, headers, 'date', 'time')),
    guestName: safeStr(getCell(row, headers, 'guest', 'guest name', 'name', 'customer')),
    platform: safeStr(getCell(row, headers, 'platform', 'source', 'channel')),
    category: safeStr(getCell(row, headers, 'category', 'type', 'department')),
    rating: safeStr(getCell(row, headers, 'rating', 'score', 'stars')),
    feedback: safeStr(getCell(row, headers, 'feedback', 'comment', 'review', 'text', 'message')),
    sentiment: safeStr(getCell(row, headers, 'sentiment', 'tone', 'feeling')),
    status: safeStr(getCell(row, headers, 'status', 'state', 'action')),
  }));
}

function parseLQA(section: MMDataSection): LQASession[] {
  const headers = section.headers;
  const rows = section.rows;

  return rows.map(row => ({
    session: safeStr(getCell(row, headers, 'session', 'name', 'title', 'module')),
    date: safeStr(getCell(row, headers, 'date', 'scheduled')),
    status: safeStr(getCell(row, headers, 'status', 'state', 'progress')),
    score: safeNum(getCell(row, headers, 'score', 'result', 'grade'), 0) || null,
    trainer: safeStr(getCell(row, headers, 'trainer', 'instructor', 'facilitator')),
    notes: safeStr(getCell(row, headers, 'notes', 'note', 'comments', 'remarks')),
  }));
}

function parseEmailBounce(section: MMDataSection): EmailBounceData {
  const headers = section.headers;
  const rows = section.rows;

  const mtdIdx = findCol(headers, 'mtd', 'month');
  const ytdIdx = findCol(headers, 'ytd', 'year');
  const targetIdx = findCol(headers, 'target', 'goal');
  const metricIdx = findCol(headers, 'metric', 'name', 'label');

  const allMetrics: EmailBounceData['allMetrics'] = [];
  let bounceRateMtd = 0, bounceRateYtd = 0;
  let openRateMtd = 0, openRateYtd = 0;
  let totalSentMtd = 0, totalSentYtd = 0;
  let bouncedMtd = 0, bouncedYtd = 0;
  let target = 2;

  rows.forEach(row => {
    const metric = safeStr(metricIdx >= 0 ? row[headers[metricIdx]] : Object.values(row)[0]);
    const mtd = safeStr(mtdIdx >= 0 ? row[headers[mtdIdx]] : '');
    const ytd = safeStr(ytdIdx >= 0 ? row[headers[ytdIdx]] : '');
    const tgt = safeStr(targetIdx >= 0 ? row[headers[targetIdx]] : '');

    allMetrics.push({ metric, mtd, ytd, target: tgt });

    const ml = metric.toLowerCase();
    if (ml.includes('bounce') && ml.includes('rate')) {
      bounceRateMtd = safeNum(mtd);
      bounceRateYtd = safeNum(ytd);
      if (tgt) target = safeNum(tgt);
    }
    if (ml.includes('open') && ml.includes('rate')) {
      openRateMtd = safeNum(mtd);
      openRateYtd = safeNum(ytd);
    }
    if (ml.includes('sent') || ml.includes('total')) {
      totalSentMtd = safeNum(mtd);
      totalSentYtd = safeNum(ytd);
    }
    if (ml === 'bounced' || ml === 'bounces' || ml.includes('hard bounce') || ml.includes('soft bounce')) {
      bouncedMtd += safeNum(mtd);
      bouncedYtd += safeNum(ytd);
    }
  });

  return {
    bounceRate: { mtd: bounceRateMtd, ytd: bounceRateYtd },
    openRate: { mtd: openRateMtd, ytd: openRateYtd },
    totalSent: { mtd: totalSentMtd, ytd: totalSentYtd },
    bounced: { mtd: bouncedMtd, ytd: bouncedYtd },
    target,
    allMetrics,
  };
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export function parseMMSheet(sheetData: Record<string, Record<string, string>[]>): MMDashboardData {
  const sections: MMDataSection[] = [];

  for (const [tabName, rows] of Object.entries(sheetData)) {
    if (rows.length === 0) continue;
    const headers = Object.keys(rows[0]);
    const type = detectSectionType(tabName, headers, rows);
    sections.push({
      id: tabName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: tabName,
      type,
      rows,
      headers,
    });
  }

  const npsSection = sections.find(s => s.type === 'nps');
  const surveySection = sections.find(s => s.type === 'surveys');
  const reviewSection = sections.find(s => s.type === 'reviews');
  const feedbackSection = sections.find(s => s.type === 'feedback');
  const lqaSection = sections.find(s => s.type === 'lqa');
  const emailSection = sections.find(s => s.type === 'email');

  const allFeedback = feedbackSection ? parseFeedback(feedbackSection) : [];
  const negativeFeedback = allFeedback.filter(f => {
    const s = f.sentiment.toLowerCase();
    const r = safeNum(f.rating);
    return s.includes('negative') || s.includes('bad') || s.includes('poor') ||
      (r > 0 && r <= 2) || f.status.toLowerCase().includes('unresolved');
  });

  return {
    sections,
    nps: npsSection ? parseNPS(npsSection) : null,
    surveys: surveySection ? parseSurveys(surveySection) : null,
    reviews: reviewSection ? parseReviews(reviewSection) : [],
    negativeFeedback,
    allFeedback,
    lqaSessions: lqaSection ? parseLQA(lqaSection) : [],
    emailBounce: emailSection ? parseEmailBounce(emailSection) : null,
    customSections: sections.filter(s => s.type === 'generic'),
    connected: sections.length > 0,
  };
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

export function generateSampleMMData(): MMDashboardData {
  return {
    connected: true,
    sections: [],
    nps: {
      score: { mtd: 72, ytd: 68 },
      totalSurveys: { mtd: 847, ytd: 9234 },
      responseRate: { mtd: 34.2, ytd: 31.8 },
      target: 70,
      trend: [58, 62, 65, 63, 67, 70, 68, 71, 69, 72, 70, 72],
      allMetrics: [
        { metric: 'NPS Score', mtd: '72', ytd: '68', target: '70' },
        { metric: 'Total Surveys', mtd: '847', ytd: '9,234', target: '900' },
        { metric: 'Response Rate', mtd: '34.2%', ytd: '31.8%', target: '35%' },
        { metric: 'Promoters %', mtd: '62%', ytd: '58%', target: '60%' },
        { metric: 'Detractors %', mtd: '8%', ytd: '12%', target: '<10%' },
      ],
    },
    surveys: {
      promoters: { count: 525, pct: 62, mtd: 525, ytd: 5556 },
      passives: { count: 254, pct: 30, mtd: 254, ytd: 2770 },
      detractors: { count: 68, pct: 8, mtd: 68, ytd: 908 },
      total: 847,
      allRows: [],
    },
    reviews: [
      { platform: 'Google', rating: 4.6, reviewCount: 312, mtdReviews: 42, ytdReviews: 312, responseRate: 98, negativeCount: 5 },
      { platform: 'TripAdvisor', rating: 4.5, reviewCount: 187, mtdReviews: 23, ytdReviews: 187, responseRate: 100, negativeCount: 3 },
      { platform: 'Booking.com', rating: 8.8, reviewCount: 245, mtdReviews: 31, ytdReviews: 245, responseRate: 95, negativeCount: 7 },
      { platform: 'Expedia', rating: 4.4, reviewCount: 98, mtdReviews: 12, ytdReviews: 98, responseRate: 88, negativeCount: 4 },
      { platform: 'Hotels.com', rating: 4.3, reviewCount: 67, mtdReviews: 8, ytdReviews: 67, responseRate: 92, negativeCount: 2 },
    ],
    allFeedback: [
      { date: '2025-06-01', guestName: 'Robert Chen', platform: 'Google', category: 'Housekeeping', rating: '2', feedback: 'Room was not cleaned properly on second day. Towels were not replaced.', sentiment: 'Negative', status: 'Resolved' },
      { date: '2025-06-03', guestName: 'Maria Santos', platform: 'TripAdvisor', category: 'Front Desk', rating: '1', feedback: 'Long wait time at check-in. Staff seemed unprepared for the busy period.', sentiment: 'Negative', status: 'In Progress' },
      { date: '2025-06-05', guestName: 'James Wilson', platform: 'Booking.com', category: 'F&B', rating: '2', feedback: 'Breakfast variety was limited. Cold food served at the buffet.', sentiment: 'Negative', status: 'Resolved' },
      { date: '2025-06-08', guestName: 'Sophie Laurent', platform: 'Google', category: 'Maintenance', rating: '1', feedback: 'Air conditioning was not working properly. Reported twice but not fixed during stay.', sentiment: 'Negative', status: 'Unresolved' },
      { date: '2025-06-10', guestName: 'Amit Patel', platform: 'Booking.com', category: 'Housekeeping', rating: '2', feedback: 'Found hair in the bathroom upon arrival. Not a good first impression.', sentiment: 'Negative', status: 'Resolved' },
      { date: '2025-06-12', guestName: 'Emma Watson', platform: 'TripAdvisor', category: 'F&B', rating: '2', feedback: 'Room service took over 45 minutes. Food was lukewarm when it arrived.', sentiment: 'Negative', status: 'In Progress' },
      { date: '2025-06-15', guestName: 'Yuki Tanaka', platform: 'Expedia', category: 'Front Desk', rating: '1', feedback: 'Reservation was lost. Had to wait 30 minutes while they sorted it out.', sentiment: 'Negative', status: 'Resolved' },
    ],
    negativeFeedback: [],
    lqaSessions: [
      { session: 'Guest Greeting Standards', date: '2025-06-02', status: 'Completed', score: 92, trainer: 'Sarah Mitchell', notes: 'Team exceeded expectations. Minor improvement on eye contact.' },
      { session: 'Complaint Handling', date: '2025-06-09', status: 'Completed', score: 85, trainer: 'David Park', notes: 'Good progress. Need more practice on escalation procedures.' },
      { session: 'Upselling Techniques', date: '2025-06-16', status: 'In Progress', score: null, trainer: 'Maria Garcia', notes: 'Session ongoing. Focus on room upgrade offers.' },
      { session: 'Service Recovery', date: '2025-06-23', status: 'Scheduled', score: null, trainer: 'James Thompson', notes: 'Upcoming session. Will cover the HEART framework.' },
      { session: 'Phone Etiquette', date: '2025-05-28', status: 'Completed', score: 78, trainer: 'Sarah Mitchell', notes: 'Below target. Refresher scheduled for next month.' },
    ],
    emailBounce: {
      bounceRate: { mtd: 1.8, ytd: 2.1 },
      openRate: { mtd: 42.5, ytd: 39.8 },
      totalSent: { mtd: 12450, ytd: 148200 },
      bounced: { mtd: 224, ytd: 3112 },
      target: 2,
      allMetrics: [
        { metric: 'Bounce Rate', mtd: '1.8%', ytd: '2.1%', target: '<2%' },
        { metric: 'Open Rate', mtd: '42.5%', ytd: '39.8%', target: '40%' },
        { metric: 'Total Sent', mtd: '12,450', ytd: '148,200', target: '' },
        { metric: 'Bounced', mtd: '224', ytd: '3,112', target: '' },
        { metric: 'Click Rate', mtd: '8.2%', ytd: '7.5%', target: '8%' },
      ],
    },
    customSections: [],
  };
}
