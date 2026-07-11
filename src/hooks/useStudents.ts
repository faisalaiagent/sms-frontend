import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api, attachAuthInterceptor } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type { ApiSuccess, ApiPaginated, Student } from '@/types';
import { toast } from 'sonner';

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  sectionId?: string;
  status?: string;
}

export function useStudents(filters: StudentFilters = {}) {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      if (filters.search) params.set('search', filters.search);
      if (filters.classId) params.set('classId', filters.classId);
      if (filters.sectionId) params.set('sectionId', filters.sectionId);
      if (filters.status) params.set('status', filters.status);

      const res = await api.get<ApiPaginated<Student>>(
        `${API_ENDPOINTS.STUDENTS}?${params.toString()}`
      );
      return res.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useStudent(id: string) {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<Student>>(
        `${API_ENDPOINTS.STUDENTS}/${id}`
      );
      return res.data.data;
    },
    enabled: !!isSignedIn && !!id,
    staleTime: 0,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post<ApiSuccess<Student>>(
        API_ENDPOINTS.STUDENTS,
        data
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(data.message);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to add student';
      toast.error(message);
    },
  });
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.patch<ApiSuccess<Student>>(
        `${API_ENDPOINTS.STUDENTS}/${id}`,
        data
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', id] });
      toast.success(data.message);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to update student';
      toast.error(message);
    },
  });
}

export function useArchiveStudent() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.patch<ApiSuccess<Student>>(
        `${API_ENDPOINTS.STUDENTS}/${id}/archive`
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(data.message);
    },
    onError: () => {
      toast.error('Failed to archive student');
    },
  });
}
