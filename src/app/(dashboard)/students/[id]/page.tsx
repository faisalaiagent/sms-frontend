'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Archive,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  User,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StudentStatusBadge } from '@/components/students/StudentStatusBadge';
import { useStudent, useArchiveStudent } from '@/hooks/useStudents';
import { ROUTES, GENDER_LABELS } from '@/constants';
import { formatDate, getInitials } from '@/lib/utils';
import { useState } from 'react';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showArchive, setShowArchive] = useState(false);
  const { data: student, isLoading } = useStudent(id);
  const archiveMutation = useArchiveStudent();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <div className="lg:col-span-2">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Student not found.</p>
        <Button variant="outline" asChild>
          <Link href={ROUTES.STUDENTS}>Back to Students</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{student.fullName}</h2>
            <p className="text-muted-foreground text-sm">{student.admissionNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {student.status === 'ACTIVE' && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`${ROUTES.STUDENTS}/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowArchive(true)}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — student card */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={student.photoUrl ?? undefined} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(student.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{student.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                </div>
                <StudentStatusBadge status={student.status} />
              </div>

              <div className="mt-6 space-y-0">
                <InfoRow
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Class / Section"
                  value={`${student.section?.class?.name} — Section ${student.section?.name}`}
                />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Gender"
                  value={GENDER_LABELS[student.gender]}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date of Birth"
                  value={formatDate(student.dateOfBirth)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Admission Date"
                  value={formatDate(student.admissionDate)}
                />
                {student.address && (
                  <InfoRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="Address"
                    value={student.address}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parent info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Parent / Guardian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 pt-0">
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Name"
                value={student.parentName}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone (WhatsApp)"
                value={student.parentPhone}
              />
              {student.parentEmail && (
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={student.parentEmail}
                />
              )}
              {student.emergencyContact && (
                <InfoRow
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="Emergency Contact"
                  value={student.emergencyContact}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel — tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Student Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-3xl font-bold">—</p>
                      <p className="text-sm text-muted-foreground mt-1">Attendance %</p>
                      <p className="text-xs text-muted-foreground">Available in Phase 2</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-3xl font-bold">—</p>
                      <p className="text-sm text-muted-foreground mt-1">Fees Paid</p>
                      <p className="text-xs text-muted-foreground">Available in Phase 3</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-3xl font-bold">—</p>
                      <p className="text-sm text-muted-foreground mt-1">Outstanding</p>
                      <p className="text-xs text-muted-foreground">Available in Phase 3</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-3xl font-bold">—</p>
                      <p className="text-sm text-muted-foreground mt-1">Last Result</p>
                      <p className="text-xs text-muted-foreground">Available in Phase 4</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
                  <Badge variant="outline">Phase 2</Badge>
                  <p className="text-sm text-muted-foreground text-center">
                    Attendance history will be available once the Attendance module is built.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="mt-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
                  <Badge variant="outline">Phase 3</Badge>
                  <p className="text-sm text-muted-foreground text-center">
                    Fee history will be available once the Fees module is built.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="mt-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
                  <Badge variant="outline">Phase 4</Badge>
                  <p className="text-sm text-muted-foreground text-center">
                    Exam results will be available once the Exams module is built.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Archive confirm dialog */}
      <ConfirmDialog
        open={showArchive}
        onOpenChange={setShowArchive}
        title="Archive Student"
        description={`Are you sure you want to archive ${student.fullName}? Their records will be preserved but they will be removed from active lists.`}
        confirmLabel="Archive Student"
        loading={archiveMutation.isPending}
        onConfirm={() => {
          archiveMutation.mutate(id, {
            onSuccess: () => {
              setShowArchive(false);
              router.push(ROUTES.STUDENTS);
            },
          });
        }}
      />
    </div>
  );
}
