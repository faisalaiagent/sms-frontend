'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api, attachAuthInterceptor } from '@/lib/api';
import { getInitials, cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  status: string;
  date: string;
  student: {
    id: string;
    fullName: string;
    admissionNumber: string;
    section: { name: string; class: { name: string } };
  };
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700',
  ABSENT:  'bg-red-100 text-red-700',
  LATE:    'bg-amber-100 text-amber-700',
  LEAVE:   'bg-blue-100 text-blue-700',
};

export default function DailyReportPage() {
  const { isSignedIn, getToken } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-daily', date],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: AttendanceRecord[] }>(
        `/attendance?date=${date}`
      );
      return res.data.data;
    },
    enabled: !!isSignedIn && !!date,
    staleTime: 0,
  });

  const summary = {
    PRESENT: data?.filter((r) => r.status === 'PRESENT').length ?? 0,
    ABSENT:  data?.filter((r) => r.status === 'ABSENT').length ?? 0,
    LATE:    data?.filter((r) => r.status === 'LATE').length ?? 0,
    LEAVE:   data?.filter((r) => r.status === 'LEAVE').length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/attendance"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daily Attendance Report</h2>
          <p className="text-muted-foreground text-sm mt-1">View attendance for a specific date</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-48"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(summary).map(([status, count]) => (
          <Card key={status} className={cn('border-l-4',
            status === 'PRESENT' && 'border-l-green-500',
            status === 'ABSENT'  && 'border-l-red-500',
            status === 'LATE'    && 'border-l-amber-500',
            status === 'LEAVE'   && 'border-l-blue-500',
          )}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground capitalize">{status.toLowerCase()}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Attendance Records — {new Date(date).toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data && data.length > 0 ? (
            <div className="space-y-2">
              {data.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(record.student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{record.student.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.student.admissionNumber} · {record.student.section?.class?.name} — {record.student.section?.name}
                      </p>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[record.status]}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-sm text-muted-foreground">
                No attendance records found for this date.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
