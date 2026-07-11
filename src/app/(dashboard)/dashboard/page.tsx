'use client';

import Link from 'next/link';
import {
  Users,
  School,
  ClipboardList,
  Banknote,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDashboardStats,
  useAttendanceChart,
  useRecentAnnouncements,
  useUpcomingExams,
} from '@/hooks/useDashboard';
import { ROUTES } from '@/constants';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useAttendanceChart();
  const { data: announcements, isLoading: announcementsLoading } =
    useRecentAnnouncements();
  const { data: exams, isLoading: examsLoading } = useUpcomingExams();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening at your school today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          subtitle="Active students"
          icon={Users}
          accent="blue"
          loading={statsLoading}
        />
        <StatCard
          title="Total Classes"
          value={stats?.totalClasses ?? 0}
          subtitle={`${stats?.totalSections ?? 0} sections`}
          icon={School}
          accent="purple"
          loading={statsLoading}
        />
        <StatCard
          title="Today's Attendance"
          value={
            stats ? `${stats.todayAttendance.presentPercentage}%` : '—'
          }
          subtitle={
            stats
              ? `${stats.todayAttendance.PRESENT} present · ${stats.todayAttendance.ABSENT} absent`
              : 'Not marked yet'
          }
          icon={ClipboardList}
          accent={
            (stats?.todayAttendance.presentPercentage ?? 0) >= 80
              ? 'green'
              : 'amber'
          }
          loading={statsLoading}
        />
        <StatCard
          title="Fees Collected"
          value={formatCurrency(stats?.feeCollection.thisMonth ?? 0)}
          subtitle="This month"
          icon={Banknote}
          accent="green"
          loading={statsLoading}
        />
        <StatCard
          title="Outstanding Fees"
          value={formatCurrency(stats?.feeCollection.outstandingTotal ?? 0)}
          subtitle={`${stats?.feeCollection.studentsWithOverdueFees ?? 0} students with pending fees`}
          icon={AlertCircle}
          accent="red"
          loading={statsLoading}
        />
        <StatCard
          title="Upcoming Exams"
          value={exams?.length ?? 0}
          subtitle="Scheduled exams"
          icon={CalendarDays}
          accent="amber"
          loading={examsLoading}
        />
      </div>

      {/* Charts + Quick panels */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceChart data={chartData} loading={chartLoading} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={ROUTES.ATTENDANCE_MARK}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Mark Today's Attendance
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={ROUTES.STUDENTS_NEW}>
                <Users className="mr-2 h-4 w-4" />
                Add New Student
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/fees">
                <Banknote className="mr-2 h-4 w-4" />
                Record a Payment
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent announcements + Upcoming exams */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Announcements</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.ANNOUNCEMENTS}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {announcementsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : announcements && announcements.length > 0 ? (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.publishedAt ? formatDate(a.publishedAt) : '—'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {a.audienceType === 'ALL' ? 'All' : 'Class'}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No announcements yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Exams</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.EXAMS}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {examsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : exams && exams.length > 0 ? (
              <ul className="space-y-3">
                {exams.map((exam) => (
                  <li key={exam.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      Upcoming
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No upcoming exams scheduled.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
