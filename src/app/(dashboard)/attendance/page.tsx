'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ClipboardList, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, attachAuthInterceptor } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type { ApiSuccess, DashboardStats } from '@/types';

export default function AttendancePage() {
  const { isSignedIn, getToken } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<DashboardStats>>(API_ENDPOINTS.DASHBOARD_STATS);
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Attendance</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Mark and track student attendance across all classes.
        </p>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [1,2,3,4].map((i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-3xl font-bold mt-1">{stats?.todayAttendance.PRESENT ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Absent Today</p>
                <p className="text-3xl font-bold mt-1">{stats?.todayAttendance.ABSENT ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Late Today</p>
                <p className="text-3xl font-bold mt-1">{stats?.todayAttendance.LATE ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Attendance %</p>
                <p className="text-3xl font-bold mt-1">
                  {stats?.todayAttendance.presentPercentage ?? 0}%
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Mark Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Take today's attendance for any class and section. Parents of absent students
              will be notified via WhatsApp automatically.
            </p>
            <Button asChild className="w-full">
              <Link href="/attendance/mark">Mark Today's Attendance</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Daily Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View attendance summary for any specific date across all classes and sections.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/attendance/reports/daily">View Daily Report</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Monthly Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View monthly attendance percentages per class and identify attendance trends.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/attendance/reports/monthly">View Monthly Report</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
