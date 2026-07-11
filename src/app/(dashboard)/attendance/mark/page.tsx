'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { CheckCircle, XCircle, Clock, FileText, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api, attachAuthInterceptor } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { getInitials, cn } from '@/lib/utils';
import type { ApiSuccess, Class, Section, Student } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

const STATUS_CONFIG = {
  PRESENT: {
    label: 'P',
    fullLabel: 'Present',
    icon: CheckCircle,
    class: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
    activeClass: 'bg-green-500 text-white border-green-500',
  },
  ABSENT: {
    label: 'A',
    fullLabel: 'Absent',
    icon: XCircle,
    class: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
    activeClass: 'bg-red-500 text-white border-red-500',
  },
  LATE: {
    label: 'L',
    fullLabel: 'Late',
    icon: Clock,
    class: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
    activeClass: 'bg-amber-500 text-white border-amber-500',
  },
  LEAVE: {
    label: 'Lv',
    fullLabel: 'Leave',
    icon: FileText,
    class: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
    activeClass: 'bg-blue-500 text-white border-blue-500',
  },
};

export default function MarkAttendancePage() {
  const { isSignedIn, getToken } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const today = new Date().toISOString().split('T')[0];

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<Class[]>>(API_ENDPOINTS.CLASSES);
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  // Fetch sections for selected class
  const { data: sections } = useQuery({
    queryKey: ['sections', selectedClassId],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<Section[]>>(
        `${API_ENDPOINTS.SECTIONS}?classId=${selectedClassId}`
      );
      return res.data.data;
    },
    enabled: !!isSignedIn && !!selectedClassId,
  });

  // Fetch students for selected section
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-attendance', selectedSectionId],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: Student[]; meta: { total: number } }>(
        `${API_ENDPOINTS.STUDENTS}?sectionId=${selectedSectionId}&status=ACTIVE&limit=100`
      );
      // Initialize all students as PRESENT by default
      const initial: Record<string, AttendanceStatus> = {};
      res.data.data.forEach((s) => { initial[s.id] = 'PRESENT'; });
      setAttendance(initial);
      setStudentsLoaded(true);
      return res.data.data;
    },
    enabled: !!isSignedIn && !!selectedSectionId,
    staleTime: 0,
  });

  // Submit attendance mutation
  const submitAttendance = useMutation({
    mutationFn: async () => {
      attachAuthInterceptor(() => getToken());
      const records: AttendanceRecord[] = Object.entries(attendance).map(
        ([studentId, status]) => ({ studentId, status })
      );
      const res = await api.post('/attendance/bulk', {
        sectionId: selectedSectionId,
        date: today,
        records,
      });
      return res.data;
    },
    onSuccess: () => {
      const absentCount = Object.values(attendance).filter((s) => s === 'ABSENT').length;
      toast.success(
        `Attendance submitted! ${absentCount > 0 ? `${absentCount} parent(s) will be notified via WhatsApp.` : 'All students present.'}`
      );
      // Reset for next section
      setSelectedSectionId('');
      setStudentsLoaded(false);
      setAttendance({});
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to submit attendance';
      toast.error(msg);
    },
  });

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    studentsData?.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const summary = {
    PRESENT: Object.values(attendance).filter((s) => s === 'PRESENT').length,
    ABSENT: Object.values(attendance).filter((s) => s === 'ABSENT').length,
    LATE: Object.values(attendance).filter((s) => s === 'LATE').length,
    LEAVE: Object.values(attendance).filter((s) => s === 'LEAVE').length,
  };

  const selectedClass = classes?.find((c) => c.id === selectedClassId);
  const selectedSection = sections?.find((s) => s.id === selectedSectionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/attendance">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mark Attendance</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-PK', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Step 1 — Select class & section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 — Select Class & Section</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2 min-w-[180px]">
            <Label>Class</Label>
            <Select
              value={selectedClassId}
              onValueChange={(v) => {
                setSelectedClassId(v);
                setSelectedSectionId('');
                setStudentsLoaded(false);
                setAttendance({});
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 min-w-[160px]">
            <Label>Section</Label>
            <Select
              value={selectedSectionId}
              onValueChange={(v) => {
                setSelectedSectionId(v);
                setStudentsLoaded(false);
                setAttendance({});
              }}
              disabled={!selectedClassId}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={selectedClassId ? 'Select section' : 'Select class first'} />
              </SelectTrigger>
              <SelectContent>
                {sections?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>Section {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 — Mark attendance */}
      {selectedSectionId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Step 2 — {selectedClass?.name} · Section {selectedSection?.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Mark all:</span>
                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => markAll(status)}
                  >
                    {STATUS_CONFIG[status].fullLabel}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : studentsData && studentsData.length > 0 ? (
              <div className="space-y-2">
                {studentsData.map((student, index) => {
                  const currentStatus = attendance[student.id] ?? 'PRESENT';
                  return (
                    <div
                      key={student.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-3 transition-colors',
                        currentStatus === 'ABSENT' && 'bg-red-50 border-red-200',
                        currentStatus === 'PRESENT' && 'bg-green-50/50 border-green-100',
                        currentStatus === 'LATE' && 'bg-amber-50 border-amber-200',
                        currentStatus === 'LEAVE' && 'bg-blue-50 border-blue-200',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6 text-right">
                          {index + 1}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(student.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.admissionNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                          const isActive = currentStatus === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() =>
                                setAttendance((prev) => ({ ...prev, [student.id]: status }))
                              }
                              className={cn(
                                'w-10 h-9 rounded-md border text-sm font-semibold transition-all',
                                isActive
                                  ? STATUS_CONFIG[status].activeClass
                                  : STATUS_CONFIG[status].class
                              )}
                            >
                              {STATUS_CONFIG[status].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <Users className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No active students in this section.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Summary & Submit */}
      {studentsLoaded && studentsData && studentsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 3 — Review & Submit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              {(Object.keys(summary) as AttendanceStatus[]).map((status) => (
                <div
                  key={status}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-3 border',
                    status === 'PRESENT' && 'bg-green-50 border-green-200',
                    status === 'ABSENT' && 'bg-red-50 border-red-200',
                    status === 'LATE' && 'bg-amber-50 border-amber-200',
                    status === 'LEAVE' && 'bg-blue-50 border-blue-200',
                  )}
                >
                  <span className="text-2xl font-bold">{summary[status]}</span>
                  <span className="text-sm text-muted-foreground">
                    {STATUS_CONFIG[status].fullLabel}
                  </span>
                </div>
              ))}
            </div>

            {summary.ABSENT > 0 && (
              <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  <strong>{summary.ABSENT} student(s)</strong> marked absent.
                  WhatsApp notifications will be sent to their parents automatically.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={() => submitAttendance.mutate()}
              disabled={submitAttendance.isPending}
            >
              {submitAttendance.isPending
                ? 'Submitting...'
                : `Submit Attendance for ${studentsData.length} Students`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
