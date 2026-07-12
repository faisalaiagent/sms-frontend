'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { AttendanceTrendPoint } from '@/types';

interface AttendanceChartProps {
  data?: AttendanceTrendPoint[];
  loading?: boolean;
}

export function AttendanceChart({ data, loading }: AttendanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData =
    data?.map((d) => ({
      date: format(new Date(d.date), 'dd MMM'),
      attendance: d.presentPercentage,
    })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No attendance data yet. Start marking attendance to see the trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [`${value ?? 0}%`, 'Present']}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                }}
              />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
