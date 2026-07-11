'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, attachAuthInterceptor } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MonthlyData {
  date: string;
  presentPercentage: number;
}

export default function MonthlyReportPage() {
  const { isSignedIn, getToken } = useAuth();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-monthly', month],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: MonthlyData[] }>(
        `/dashboard/attendance-chart`
      );
      // Filter to selected month
      return res.data.data.filter((d) => d.date.startsWith(month));
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  const avgAttendance = data && data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + d.presentPercentage, 0) / data.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/attendance"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monthly Attendance Report</h2>
          <p className="text-muted-foreground text-sm mt-1">Attendance trends by month</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4 flex items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          {!isLoading && data && (
            <div className="text-sm text-muted-foreground">
              Average attendance: <strong>{avgAttendance}%</strong> over {data.length} days
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Attendance — {month}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : data && data.length > 0 ? (
            <div className="space-y-2">
              {data.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28">
                    {new Date(day.date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full flex items-center justify-end pr-2 transition-all',
                        day.presentPercentage >= 80 ? 'bg-green-500' :
                        day.presentPercentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${Math.max(day.presentPercentage, 5)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {day.presentPercentage}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">
                No attendance data for this month yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
