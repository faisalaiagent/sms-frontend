'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { api, attachAuthInterceptor } from '@/lib/api';
import { getInitials, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExamTerm { id: string; name: string; }
interface ClassOption { id: string; name: string; }
interface Subject { id: string; name: string; totalMarks: number; passingMarks: number; classId: string; }
interface Section { id: string; name: string; classId: string; }
interface Student { id: string; fullName: string; admissionNumber: string; sectionId: string; }
interface ExistingMark { studentId: string; marksObtained: number; grade: string | null; }

function getGradeColor(marks: number, total: number, passing: number): string {
  if (marks < passing) return 'text-red-600';
  const pct = (marks / total) * 100;
  if (pct >= 80) return 'text-green-600';
  if (pct >= 60) return 'text-blue-600';
  return 'text-amber-600';
}

export default function MarksEntryPage() {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();

  const [examTermId, setExamTermId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [marks, setMarks] = useState<Record<string, string>>({});

  const fetchWithAuth = async (url: string) => {
    attachAuthInterceptor(() => getToken());
    const res = await api.get(url);
    return res.data.data;
  };

  const { data: examTerms } = useQuery({
    queryKey: ['exam-terms'],
    queryFn: () => fetchWithAuth('/exams/terms'),
    enabled: !!isSignedIn,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchWithAuth('/classes'),
    enabled: !!isSignedIn,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects', classId],
    queryFn: () => fetchWithAuth(`/exams/subjects?classId=${classId}`),
    enabled: !!isSignedIn && !!classId,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections', classId],
    queryFn: () => fetchWithAuth(`/sections?classId=${classId}`),
    enabled: !!isSignedIn && !!classId,
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-marks', sectionId],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get(`/students?sectionId=${sectionId}&status=ACTIVE&limit=100`);
      return (res.data as { data: Student[] }).data;
    },
    enabled: !!isSignedIn && !!sectionId,
  });

  const { data: existingMarks } = useQuery({
    queryKey: ['existing-marks', examTermId, subjectId],
    queryFn: () => fetchWithAuth(`/exams/marks?examTermId=${examTermId}&subjectId=${subjectId}`),
    enabled: !!isSignedIn && !!examTermId && !!subjectId,
  });

  // Pre-fill marks from existing data
  useEffect(() => {
    if (existingMarks && students) {
      const initial: Record<string, string> = {};
      (existingMarks as ExistingMark[]).forEach((m) => {
        initial[m.studentId] = String(m.marksObtained);
      });
      setMarks((prev) => ({ ...initial, ...prev }));
    }
  }, [existingMarks, students]);

  const selectedSubject = (subjects as Subject[] | undefined)?.find((s) => s.id === subjectId);

  const saveMarks = useMutation({
    mutationFn: async () => {
      attachAuthInterceptor(() => getToken());
      const marksArray = Object.entries(marks)
        .filter(([, value]) => value !== '')
        .map(([studentId, value]) => ({
          studentId,
          marksObtained: parseFloat(value),
        }));
      const res = await api.post('/exams/marks/bulk', {
        examTermId, subjectId, marks: marksArray,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['existing-marks'] });
      toast.success(data.message);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save marks';
      toast.error(msg);
    },
  });

  const studentList = (students as Student[] | undefined) ?? [];
  const enteredCount = studentList.filter((s) => marks[s.id] && marks[s.id] !== '').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/exams"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enter Marks</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Select exam term, class, subject, and section to enter marks
          </p>
        </div>
      </div>

      {/* Selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selection</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2 min-w-[180px]">
            <Label>Exam Term</Label>
            <Select value={examTermId} onValueChange={setExamTermId}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select term" /></SelectTrigger>
              <SelectContent>
                {(examTerms as ExamTerm[] | undefined)?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[160px]">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(v) => {
              setClassId(v); setSubjectId(''); setSectionId('');
            }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {(classes as ClassOption[] | undefined)?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[160px]">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder={classId ? "Select subject" : "Select class first"} /></SelectTrigger>
              <SelectContent>
                {(subjects as Subject[] | undefined)?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[150px]">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder={classId ? "Select section" : "Select class first"} /></SelectTrigger>
              <SelectContent>
                {(sections as Section[] | undefined)?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>Section {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Marks entry table */}
      {examTermId && subjectId && sectionId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedSubject?.name} — Max {selectedSubject?.totalMarks} marks
              </CardTitle>
              <Badge variant="secondary">
                {enteredCount} / {studentList.length} entered
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-2">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : studentList.length > 0 ? (
              <div className="space-y-2">
                {studentList.map((student, index) => {
                  const value = marks[student.id] ?? '';
                  const numValue = parseFloat(value);
                  const isValid = !isNaN(numValue) && numValue >= 0 && numValue <= (selectedSubject?.totalMarks ?? 100);

                  return (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6 text-right">{index + 1}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(student.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={0}
                          max={selectedSubject?.totalMarks}
                          value={value}
                          onChange={(e) => setMarks((prev) => ({ ...prev, [student.id]: e.target.value }))}
                          className={cn(
                            'w-24 text-right font-medium',
                            value !== '' && !isValid && 'border-destructive'
                          )}
                          placeholder="—"
                        />
                        {value !== '' && isValid && selectedSubject && (
                          <span className={cn('text-sm font-semibold w-10', getGradeColor(numValue, selectedSubject.totalMarks, selectedSubject.passingMarks))}>
                            {Math.round((numValue / selectedSubject.totalMarks) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <Users className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No active students in this section.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {examTermId && subjectId && sectionId && studentList.length > 0 && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => saveMarks.mutate()}
          disabled={saveMarks.isPending || enteredCount === 0}
        >
          <Save className="mr-2 h-4 w-4" />
          {saveMarks.isPending ? 'Saving...' : `Save Marks for ${enteredCount} Students`}
        </Button>
      )}
    </div>
  );
}
