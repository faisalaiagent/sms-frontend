import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api, attachAuthInterceptor } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type {
  ApiSuccess,
  DashboardStats,
  AttendanceTrendPoint,
  Announcement,
  ExamTerm,
} from '@/types';

export function useDashboardStats() {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<DashboardStats>>(
        API_ENDPOINTS.DASHBOARD_STATS
      );
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useAttendanceChart() {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'attendance-chart'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<AttendanceTrendPoint[]>>(
        API_ENDPOINTS.DASHBOARD_ATTENDANCE_CHART
      );
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });
}

export function useRecentAnnouncements() {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'recent-announcements'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<Announcement[]>>(
        API_ENDPOINTS.DASHBOARD_ANNOUNCEMENTS
      );
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });
}

export function useUpcomingExams() {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'upcoming-exams'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<ExamTerm[]>>(
        API_ENDPOINTS.DASHBOARD_EXAMS
      );
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });
}
