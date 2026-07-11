'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, Search, Printer, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { api, attachAuthInterceptor } from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface ExamTerm { id: string; name: string; }
interface Student { id: string; fullName: string; admissionNumber: string; section?: { name: string; class: { name: string } }; }
interface Mark {
  id: string;
  marksObtained: number;
  grade: string | null;
  subject: { name: string; totalMarks: number; passingMarks: number };
}
interface ReportCardData {
  marks: Mark[];
  totalObtained: number;
  totalMax: number;
  overallPercentage: number;
  overallGrade: string;
}

export default function ReportCardsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [examTermId, setExamTermId] = useState('');

  const { data: examTerms } = useQuery({
    queryKey: ['exam-terms'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: ExamTerm[] }>('/exams/terms');
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['students-search-rc', search],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: Student[] }>(`/students?search=${search}&status=ACTIVE&limit=10`);
      return res.data.data;
    },
    enabled: !!isSignedIn && search.length >= 2,
  });

  const { data: reportCard, isLoading: reportLoading } = useQuery({
    queryKey: ['report-card', selectedStudent?.id, examTermId],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: ReportCardData }>(
        `/exams/marks/student/${selectedStudent!.id}/${examTermId}`
      );
      return res.data.data;
    },
    enabled: !!isSignedIn && !!selectedStudent && !!examTermId,
  });

  const selectedTerm = (examTerms as ExamTerm[] | undefined)?.find((t) => t.id === examTermId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/exams"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Report Cards</h2>
          <p className="text-muted-foreground text-sm mt-1">Search for a student and exam term to view their report card</p>
        </div>
      </div>

      {/* Selectors */}
      <Card className="print:hidden">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name or admission number..."
                  value={selectedStudent ? selectedStudent.fullName : search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedStudent(null);
                  }}
                />
              </div>
              {search.length >= 2 && !selectedStudent && (searchResults as Student[] | undefined)?.length ? (
                <div className="border rounded-md mt-1 max-h-48 overflow-y-auto">
                  {(searchResults as Student[]).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => { setSelectedStudent(s); setSearch(''); }}
                    >
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{getInitials(s.fullName)}</AvatarFallback></Avatar>
                      <span className="text-sm">{s.fullName} — {s.admissionNumber}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Exam Term</Label>
              <Select value={examTermId} onValueChange={setExamTermId}>
                <SelectTrigger><SelectValue placeholder="Select exam term" /></SelectTrigger>
                <SelectContent>
                  {(examTerms as ExamTerm[] | undefined)?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report card */}
      {selectedStudent && examTermId && (
        <>
          {reportLoading ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">Loading report card...</CardContent></Card>
          ) : reportCard && (reportCard as ReportCardData).marks.length > 0 ? (
            <>
              <div className="flex justify-end print:hidden">
                <Button onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Report Card
                </Button>
              </div>
              <Card className="print:shadow-none print:border-0">
                <CardContent className="p-8 space-y-6">
                  {/* School header */}
                  <div className="text-center border-b pb-4">
                    <h1 className="text-xl font-bold">School Management System</h1>
                    <p className="text-sm text-muted-foreground">Student Report Card</p>
                  </div>

                  {/* Student info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Student Name</p>
                      <p className="font-semibold">{selectedStudent.fullName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Admission Number</p>
                      <p className="font-semibold">{selectedStudent.admissionNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Class</p>
                      <p className="font-semibold">
                        {selectedStudent.section?.class?.name} — {selectedStudent.section?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Exam Term</p>
                      <p className="font-semibold">{selectedTerm?.name}</p>
                    </div>
                  </div>

                  {/* Marks table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Subject</th>
                          <th className="text-right p-3 font-medium">Max Marks</th>
                          <th className="text-right p-3 font-medium">Obtained</th>
                          <th className="text-right p-3 font-medium">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportCard as ReportCardData).marks.map((mark) => (
                          <tr key={mark.id} className="border-t">
                            <td className="p-3">{mark.subject.name}</td>
                            <td className="p-3 text-right">{mark.subject.totalMarks}</td>
                            <td className="p-3 text-right font-medium">{mark.marksObtained}</td>
                            <td className="p-3 text-right">
                              <Badge variant="outline">{mark.grade}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30 border-t-2">
                        <tr>
                          <td className="p-3 font-semibold">Total</td>
                          <td className="p-3 text-right font-semibold">{(reportCard as ReportCardData).totalMax}</td>
                          <td className="p-3 text-right font-semibold">{(reportCard as ReportCardData).totalObtained}</td>
                          <td className="p-3 text-right"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Overall result */}
                  <div className="flex items-center justify-center gap-8 py-4 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Percentage</p>
                      <p className="text-2xl font-bold">{(reportCard as ReportCardData).overallPercentage}%</p>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Grade</p>
                      <div className="flex items-center gap-1 justify-center">
                        <Award className="h-5 w-5 text-amber-500" />
                        <p className="text-2xl font-bold">{(reportCard as ReportCardData).overallGrade}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center pt-4 border-t">
                    Generated on {formatDate(new Date().toISOString())}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <p className="text-sm text-muted-foreground">
                  No marks recorded for this student in the selected exam term.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
