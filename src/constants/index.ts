export const ROUTES = {
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STUDENTS_NEW: '/students/new',
  CLASSES: '/classes',
  SECTIONS: '/sections',
  ACADEMIC_YEARS: '/academic-years',
  ATTENDANCE: '/attendance',
  ATTENDANCE_MARK: '/attendance/mark',
  FEES: '/fees',
  EXAMS: '/exams',
  ANNOUNCEMENTS: '/announcements',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  SIGN_IN: '/sign-in',
} as const;

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  TRANSFERRED: 'Transferred',
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  LEAVE: 'Leave',
};

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

export const GRADE_THRESHOLDS = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A' },
  { min: 70, grade: 'B+' },
  { min: 60, grade: 'B' },
  { min: 50, grade: 'C+' },
  { min: 40, grade: 'C' },
  { min: 33, grade: 'D' },
  { min: 0,  grade: 'F' },
];

export const API_ENDPOINTS = {
  // Auth
  AUTH_SYNC: '/auth/sync',
  AUTH_ME: '/auth/me',
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_ATTENDANCE_CHART: '/dashboard/attendance-chart',
  DASHBOARD_ANNOUNCEMENTS: '/dashboard/recent-announcements',
  DASHBOARD_EXAMS: '/dashboard/upcoming-exams',
  // Students
  STUDENTS: '/students',
  // Classes
  CLASSES: '/classes',
  // Sections
  SECTIONS: '/sections',
  // Academic Years
  ACADEMIC_YEARS: '/academic-years',
} as const;
