import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type { ApiSuccess, Class, Section } from '@/types';

export function useClasses() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Class[]>>(API_ENDPOINTS.CLASSES);
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });
}

export function useSections(classId?: string) {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['sections', classId],
    queryFn: async () => {
      const url = classId
        ? `${API_ENDPOINTS.SECTIONS}?classId=${classId}`
        : API_ENDPOINTS.SECTIONS;
      const res = await api.get<ApiSuccess<Section[]>>(url);
      return res.data.data;
    },
    enabled: !!isSignedIn && !!classId,
  });
}
