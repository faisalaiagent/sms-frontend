// ── API response wrappers ─────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: unknown;
}

// ── Domain types ──────────────────────────────────────────────

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  capacity: number;
  class: Class;
}

export interface Class {
  id: string;
  name: string;
  academicYearId: string;
  academicYear?: AcademicYear;
  sections?: Section[];
}

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  photoUrl?: string;
  address?: string;
  emergencyContact?: string;
  admissionDate: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'TRANSFERRED';
  sectionId: string;
  section: Section;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalSections: number;
  todayAttendance: {
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    LEAVE: number;
    totalMarked: number;
    presentPercentage: number;
  };
  feeCollection: {
    thisMonth: number;
    outstandingTotal: number;
    studentsWithOverdueFees: number;
  };
}

export interface AttendanceTrendPoint {
  date: string;
  presentPercentage: number;
}

export interface Announcement {
  id: string;
  title: string;
  publishedAt: string;
  audienceType: 'ALL' | 'CLASS_SPECIFIC';
}

export interface ExamTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

// ── Form input types ──────────────────────────────────────────

export interface CreateStudentFormData {
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: Date;
  sectionId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address?: string;
  emergencyContact?: string;
  photoUrl?: string;
}
