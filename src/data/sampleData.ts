import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval, isWithinInterval, parseISO } from 'date-fns';

// Types
export interface KPI {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  format: 'number' | 'percent' | 'currency' | 'hours';
  icon: string;
}

export interface TrainingRecord {
  id: number;
  employeeName: string;
  department: string;
  courseName: string;
  category: string;
  status: 'Completed' | 'In Progress' | 'Not Started' | 'Overdue';
  completionDate: string | null;
  enrollmentDate: string;
  score: number | null;
  timeSpent: number; // hours
  mandatory: boolean;
}

export interface MonthlyTrend {
  month: string;
  completions: number;
  enrollments: number;
  avgScore: number;
  hoursSpent: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface DepartmentData {
  department: string;
  completionRate: number;
  avgScore: number;
  totalHours: number;
  enrollments: number;
}

export interface DailyEngagement {
  date: string;
  activeUsers: number;
  sessionsCompleted: number;
  avgSessionDuration: number;
}

// Constants
const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Product', 'Customer Support'];
const categories = ['Compliance', 'Technical Skills', 'Leadership', 'Soft Skills', 'Onboarding', 'Safety', 'Product Training', 'DEI'];
const statuses: TrainingRecord['status'][] = ['Completed', 'In Progress', 'Not Started', 'Overdue'];

const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Jacob', 'Sofia', 'Logan', 'Avery', 'Jackson', 'Ella', 'Sebastian', 'Scarlett', 'Aiden', 'Grace', 'Matthew', 'Chloe', 'Samuel', 'Victoria', 'David'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const courseNames: Record<string, string[]> = {
  'Compliance': ['Data Privacy Fundamentals', 'Anti-Harassment Training', 'Code of Conduct 2025', 'GDPR Compliance', 'SOX Compliance Essentials'],
  'Technical Skills': ['Advanced Python Programming', 'Cloud Architecture (AWS)', 'React & TypeScript Mastery', 'Data Engineering Pipeline', 'Cybersecurity Fundamentals'],
  'Leadership': ['Leading High-Performance Teams', 'Executive Presence Workshop', 'Strategic Decision Making', 'Coaching for Managers', 'Change Management'],
  'Soft Skills': ['Effective Communication', 'Conflict Resolution', 'Time Management Mastery', 'Presentation Skills Pro', 'Emotional Intelligence'],
  'Onboarding': ['Company Culture & Values', 'Systems & Tools Setup', 'Role-Specific Orientation', 'Benefits & Policies Overview', 'First 90 Days Roadmap'],
  'Safety': ['Workplace Safety Standards', 'Emergency Response Protocol', 'Ergonomics Best Practices', 'Fire Safety Training', 'First Aid Certification'],
  'Product Training': ['Product Suite Overview 2025', 'New Feature Deep Dive Q1', 'Customer Use Cases', 'Competitive Landscape', 'Demo & Pitch Training'],
  'DEI': ['Unconscious Bias Awareness', 'Inclusive Leadership', 'Cultural Competency', 'Allyship in the Workplace', 'Accessible Design Principles'],
};

const categoryColors: Record<string, string> = {
  'Compliance': '#6366f1',
  'Technical Skills': '#3b82f6',
  'Leadership': '#8b5cf6',
  'Soft Skills': '#ec4899',
  'Onboarding': '#14b8a6',
  'Safety': '#f97316',
  'Product Training': '#10b981',
  'DEI': '#f59e0b',
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return +(rand() * (max - min) + min).toFixed(1);
}

// Generate training records
export function generateTrainingRecords(count: number = 200): TrainingRecord[] {
  const records: TrainingRecord[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const category = pick(categories);
    const course = pick(courseNames[category]);
    const status = pick(statuses);
    const enrollDaysAgo = randInt(1, 365);
    const enrollmentDate = subDays(today, enrollDaysAgo);

    let completionDate: string | null = null;
    let score: number | null = null;
    let timeSpent = 0;

    if (status === 'Completed') {
      const completionDaysAfterEnroll = randInt(1, Math.min(60, enrollDaysAgo));
      completionDate = format(subDays(today, enrollDaysAgo - completionDaysAfterEnroll), 'yyyy-MM-dd');
      score = randInt(60, 100);
      timeSpent = randFloat(0.5, 40);
    } else if (status === 'In Progress') {
      timeSpent = randFloat(0.5, 20);
    } else if (status === 'Overdue') {
      timeSpent = randFloat(0, 5);
    }

    records.push({
      id: i + 1,
      employeeName: `${pick(firstNames)} ${pick(lastNames)}`,
      department: pick(departments),
      courseName: course,
      category,
      status,
      completionDate,
      enrollmentDate: format(enrollmentDate, 'yyyy-MM-dd'),
      score,
      timeSpent,
      mandatory: rand() > 0.4,
    });
  }

  return records;
}

// Generate monthly trends (last 12 months)
export function generateMonthlyTrends(): MonthlyTrend[] {
  const today = new Date();
  const months = eachMonthOfInterval({
    start: subMonths(today, 11),
    end: today,
  });

  return months.map((m, i) => {
    const baseCompletions = 120 + i * 8;
    const baseEnrollments = 150 + i * 6;
    return {
      month: format(m, 'MMM yyyy'),
      completions: baseCompletions + randInt(-15, 25),
      enrollments: baseEnrollments + randInt(-10, 30),
      avgScore: randInt(72, 92),
      hoursSpent: randInt(800, 1800),
    };
  });
}

// Generate daily engagement (last 30 days)
export function generateDailyEngagement(): DailyEngagement[] {
  const today = new Date();
  const days = eachDayOfInterval({
    start: subDays(today, 29),
    end: today,
  });

  return days.map((d) => {
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const base = isWeekend ? 30 : 120;
    return {
      date: format(d, 'MMM dd'),
      activeUsers: base + randInt(-20, 40),
      sessionsCompleted: Math.floor((base + randInt(-15, 25)) * 0.6),
      avgSessionDuration: randFloat(15, 55),
    };
  });
}

// Category breakdown for donut chart
export function generateCategoryBreakdown(records: TrainingRecord[]): CategoryBreakdown[] {
  const counts: Record<string, number> = {};
  records.forEach(r => {
    counts[r.category] = (counts[r.category] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || '#94a3b8',
  }));
}

// Department performance
export function generateDepartmentData(records: TrainingRecord[]): DepartmentData[] {
  const deptMap: Record<string, { total: number; completed: number; scores: number[]; hours: number }> = {};

  records.forEach(r => {
    if (!deptMap[r.department]) {
      deptMap[r.department] = { total: 0, completed: 0, scores: [], hours: 0 };
    }
    deptMap[r.department].total++;
    if (r.status === 'Completed') {
      deptMap[r.department].completed++;
      if (r.score) deptMap[r.department].scores.push(r.score);
    }
    deptMap[r.department].hours += r.timeSpent;
  });

  return Object.entries(deptMap).map(([department, data]) => ({
    department,
    completionRate: Math.round((data.completed / data.total) * 100),
    avgScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
    totalHours: Math.round(data.hours),
    enrollments: data.total,
  }));
}

// KPI generation
export function generateKPIs(records: TrainingRecord[]): KPI[] {
  const completed = records.filter(r => r.status === 'Completed').length;
  const totalEnrolled = records.length;
  const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0;
  const scores = records.filter(r => r.score !== null).map(r => r.score!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalHours = Math.round(records.reduce((sum, r) => sum + r.timeSpent, 0));
  const overdue = records.filter(r => r.status === 'Overdue').length;
  const activeCourses = new Set(records.filter(r => r.status === 'In Progress' || r.status === 'Not Started' || r.status === 'Overdue').map(r => r.courseName)).size;
  const prevActiveCourses = Math.max(0, activeCourses - randInt(1, 6));

  return [
    {
      id: 'total-enrollments',
      title: 'Total Enrollments',
      value: totalEnrolled,
      previousValue: Math.max(0, Math.round(totalEnrolled * 0.87)),
      format: 'number',
      icon: 'users',
    },
    {
      id: 'completion-rate',
      title: 'Completion Rate',
      value: completionRate,
      previousValue: Math.max(0, completionRate - randInt(2, 8)),
      format: 'percent',
      icon: 'check-circle',
    },
    {
      id: 'avg-score',
      title: 'Avg. Assessment Score',
      value: avgScore,
      previousValue: Math.max(0, avgScore - randInt(-3, 5)),
      format: 'percent',
      icon: 'trophy',
    },
    {
      id: 'training-hours',
      title: 'Total Training Hours',
      value: totalHours,
      previousValue: Math.max(0, Math.round(totalHours * 0.82)),
      format: 'hours',
      icon: 'clock',
    },
    {
      id: 'overdue',
      title: 'Overdue Trainings',
      value: overdue,
      previousValue: overdue + randInt(2, 10),
      format: 'number',
      icon: 'alert-triangle',
    },
    {
      id: 'active-courses',
      title: 'Active Courses',
      value: activeCourses,
      previousValue: prevActiveCourses,
      format: 'number',
      icon: 'book-open',
    },
  ];
}

// Status breakdown for donut
export function generateStatusBreakdown(records: TrainingRecord[]): CategoryBreakdown[] {
  const statusColors: Record<string, string> = {
    'Completed': '#10b981',
    'In Progress': '#3b82f6',
    'Not Started': '#94a3b8',
    'Overdue': '#ef4444',
  };

  const counts: Record<string, number> = {};
  records.forEach(r => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: statusColors[name] || '#94a3b8',
  }));
}

// Filter records by date range and segment
export function filterRecords(
  records: TrainingRecord[],
  dateRange: { start: string; end: string },
  department: string,
  category: string,
  status: string
): TrainingRecord[] {
  return records.filter(r => {
    const enrollDate = parseISO(r.enrollmentDate);
    const inDateRange = isWithinInterval(enrollDate, {
      start: parseISO(dateRange.start),
      end: parseISO(dateRange.end),
    });

    const matchesDept = department === 'All' || r.department === department;
    const matchesCat = category === 'All' || r.category === category;
    const matchesStatus = status === 'All' || r.status === status;

    return inDateRange && matchesDept && matchesCat && matchesStatus;
  });
}

// Compute monthly trends from actual records
export function computeMonthlyTrendsFromRecords(records: TrainingRecord[]): MonthlyTrend[] {
  const today = new Date();
  const months = eachMonthOfInterval({
    start: subMonths(today, 11),
    end: today,
  });

  return months.map(m => {
    const monthStr = format(m, 'yyyy-MM');
    const enrolled = records.filter(r => r.enrollmentDate.startsWith(monthStr));
    const completed = records.filter(r => r.completionDate && r.completionDate.startsWith(monthStr));
    const scores = completed.filter(r => r.score !== null).map(r => r.score!);

    return {
      month: format(m, 'MMM yyyy'),
      enrollments: enrolled.length,
      completions: completed.length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      hoursSpent: Math.round(enrolled.reduce((sum, r) => sum + r.timeSpent, 0)),
    };
  });
}

// Compute daily engagement from actual records (last 30 days)
export function computeDailyEngagementFromRecords(records: TrainingRecord[]): DailyEngagement[] {
  const today = new Date();
  const days = eachDayOfInterval({
    start: subDays(today, 29),
    end: today,
  });

  return days.map(d => {
    const dayStr = format(d, 'yyyy-MM-dd');
    const enrolled = records.filter(r => r.enrollmentDate === dayStr);
    const completed = records.filter(r => r.completionDate === dayStr);

    return {
      date: format(d, 'MMM dd'),
      activeUsers: enrolled.length + completed.length,
      sessionsCompleted: completed.length,
      avgSessionDuration: completed.length > 0
        ? Math.round(completed.reduce((sum, r) => sum + r.timeSpent, 0) / completed.length * 60)
        : 0,
    };
  });
}

export { departments, categories, statuses as statusOptions };
