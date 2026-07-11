'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ClipboardList, Banknote, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { api, attachAuthInterceptor } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

interface AttendanceReportRow {
  className: string;
  present: number; absent: number; late: number; leave: number;
  total: number; attendancePercentage: number;
}
interface FeeReport {
  totalCollected: number;
  paymentCount: number;
  byMethod: Array<{ method: string; amount: number }>;
}
interface ResultStat {
  subjectName: string;
  averageMarks: number;
  averagePercentage: number;
  passRate: number;
  studentsCounted: number;
}
interface ExamTerm { id: string; name: string; }

function firstOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
}
function today() {
  return new Date().toISOString().split('T')[0];
}

export default function ReportsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [examTermId, setExamTermId] = useState('');

  const fetchWithAuth = async (url: string) => {
    attachAuthInterceptor(() => getToken());
    const res = await api.get(url);
    return res.data.data;
  };

  const { data: attendanceReport, isLoading: attLoading } = useQuery({
    queryKey: ['report-attendance', startDate, endDate],
    queryFn: () => fetchWithAuth(`/reports/attendance?startDate=${startDate}&endDate=${endDate}`),
    enabled: !!isSignedIn,
  });

  const { data: feeReport, isLoading: feeLoading } = useQuery({
    queryKey: ['report-fees', startDate, endDate],
    queryFn: () => fetchWithAuth(`/reports/fees?startDate=${startDate}&endDate=${endDate}`),
    enabled: !!isSignedIn,
  });

  const { data: examTerms } = useQuery({
    queryKey: ['exam-terms'],
    queryFn: () => fetchWithAuth('/exams/terms'),
    enabled: !!isSignedIn,
  });

  const { data: resultsReport, isLoading: resultsLoading } = useQuery({
    queryKey: ['report-results', examTermId],
    queryFn: () => fetchWithAuth(`/reports/results?examTermId=${examTermId}`),
    enabled: !!isSignedIn && !!examTermId,
  });

  const attendanceRows = (attendanceReport as AttendanceReportRow[] | undefined) ?? [];
  const fees = feeReport as FeeReport | undefined;
  const results = (resultsReport as { subjectStats: ResultStat[] } | undefined)?.subjectStats ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Attendance, fee collection, and exam result reports.
        </p>
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance"><ClipboardList className="h-4 w-4 mr-1" />Attendance</TabsTrigger>
          <TabsTrigger value="fees"><Banknote className="h-4 w-4 mr-1" />Fee Collection</TabsTrigger>
          <TabsTrigger value="results"><Award className="h-4 w-4 mr-1" />Result Analytics</TabsTrigger>
        </TabsList>

        {/* Date range shared by attendance + fees */}
        <div className="flex items-end gap-3 mt-4">
          <div className="space-y-2">
            <Label className="text-xs">From</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">To</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
        </div>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Attendance by Class</CardTitle></CardHeader>
            <CardContent>
              {attLoading ? (
                <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : attendanceRows.length > 0 ? (
                <div className="space-y-3">
                  {attendanceRows.map((row) => (
                    <div key={row.className} className="flex items-center gap-3">
                      <span className="text-sm w-24">{row.className}</span>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium',
                            row.attendancePercentage >= 80 ? 'bg-green-500' :
                            row.attendancePercentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${Math.max(row.attendancePercentage, 8)}%` }}
                        >
                          {row.attendancePercentage}%
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-32 text-right">
                        {row.present}P · {row.absent}A · {row.late}L · {row.leave}Lv
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No attendance data for this date range.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(fees?.totalCollected ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-3xl font-bold mt-1">{fees?.paymentCount ?? 0}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">By Payment Method</CardTitle></CardHeader>
            <CardContent>
              {feeLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : fees?.byMethod && fees.byMethod.length > 0 ? (
                <div className="space-y-2">
                  {fees.byMethod.map((m) => (
                    <div key={m.method} className="flex items-center justify-between p-2 rounded border">
                      <span className="text-sm">{m.method.replace('_', ' ')}</span>
                      <span className="text-sm font-medium">{formatCurrency(m.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No payments recorded for this date range.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <div className="mb-4 w-56">
            <Select value={examTermId} onValueChange={setExamTermId}>
              <SelectTrigger><SelectValue placeholder="Select exam term" /></SelectTrigger>
              <SelectContent>
                {(examTerms as ExamTerm[] | undefined)?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Subject Performance</CardTitle></CardHeader>
            <CardContent>
              {!examTermId ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select an exam term to view result analytics.
                </p>
              ) : resultsLoading ? (
                <div className="space-y-2">{[1,2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((r) => (
                    <div key={r.subjectName} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{r.subjectName}</span>
                        <span className="text-xs text-muted-foreground">{r.studentsCounted} students</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Avg: <strong>{r.averagePercentage}%</strong></span>
                        <span>Pass rate: <strong className={r.passRate >= 70 ? 'text-green-600' : 'text-amber-600'}>{r.passRate}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No marks recorded for this exam term yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
