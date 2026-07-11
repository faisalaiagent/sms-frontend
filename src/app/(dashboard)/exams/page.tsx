'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { CalendarDays, BookOpen, PenLine, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, attachAuthInterceptor } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ExamTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
}

export default function ExamsPage() {
  const { isSignedIn, getToken } = useAuth();

  const { data: terms, isLoading } = useQuery({
    queryKey: ['exam-terms'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: ExamTerm[] }>('/exams/terms');
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  const upcoming = terms?.filter((t) => new Date(t.startDate) >= new Date()) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Exams</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage exam terms, subjects, enter marks, and generate report cards.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Exam Terms</p>
            <p className="text-3xl font-bold mt-1">{terms?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Upcoming Terms</p>
            <p className="text-3xl font-bold mt-1">{upcoming.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-500" />
              Exam Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create and manage exam terms like Mid-Term or Final Exams.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/exams/terms">Manage Terms</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set up subjects per class with total and passing marks.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/exams/subjects">Manage Subjects</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PenLine className="h-5 w-5 text-green-500" />
              Enter Marks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter marks for students by class, subject, and exam term.
            </p>
            <Button asChild className="w-full">
              <Link href="/exams/marks">Enter Marks</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Report Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate and print report cards for individual students.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/exams/report-cards">View Report Cards</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent exam terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exam Terms</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : terms && terms.length > 0 ? (
            <div className="space-y-2">
              {terms.map((term) => (
                <div key={term.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{term.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(term.startDate)} → {formatDate(term.endDate)}
                    </p>
                  </div>
                  <Badge variant={term.isPublished ? 'default' : 'secondary'}>
                    {term.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No exam terms yet. <Link href="/exams/terms" className="underline">Create one</Link> to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
