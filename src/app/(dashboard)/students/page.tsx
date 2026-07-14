'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Download, Upload  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StudentStatusBadge } from '@/components/students/StudentStatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useStudents, useArchiveStudent } from '@/hooks/useStudents';
import { useClasses, useSections } from '@/hooks/useClasses';
import { ROUTES } from '@/constants';
import { getInitials, formatDate } from '@/lib/utils';
import type { Student } from '@/types';

export default function StudentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const { data, isLoading } = useStudents({
    page,
    limit: 20,
    search: search || undefined,
    classId: classId || undefined,
    sectionId: sectionId || undefined,
    status: status || undefined,
  });

  const { data: classes } = useClasses();
  const { data: sections } = useSections(classId || undefined);
  const archiveMutation = useArchiveStudent();

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const columns: Column<Student>[] = [
    {
      key: 'student',
      label: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.photoUrl} />
            <AvatarFallback className="text-xs">
              {getInitials(row.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.admissionNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      label: 'Class / Section',
      render: (row) => (
        <span className="text-sm">
          {row.section?.class?.name} — {row.section?.name}
        </span>
      ),
    },
    {
      key: 'parent',
      label: 'Parent',
      render: (row) => (
        <div>
          <p className="text-sm">{row.parentName}</p>
          <p className="text-xs text-muted-foreground">{row.parentPhone}</p>
        </div>
      ),
    },
    {
      key: 'admissionDate',
      label: 'Admitted',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.admissionDate)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StudentStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`${ROUTES.STUDENTS}/${row.id}`)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`${ROUTES.STUDENTS}/${row.id}/edit`)}
          >
            Edit
          </Button>
          {row.status === 'ACTIVE' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setArchiveId(row.id)}
            >
              Archive
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.meta.total ?? 0} students found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <Link href="/students/import">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.STUDENTS_NEW}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or admission number..."
            className="pl-9"
            value={search}
            onChange={handleSearch}
          />
        </div>
        <Select
          value={classId}
          onValueChange={(v) => {
            setClassId(v === 'all' ? '' : v);
            setSectionId('');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {classId && sections && sections.length > 0 && (
          <Select
            value={sectionId}
            onValueChange={(v) => {
              setSectionId(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  Section {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="TRANSFERRED">Transferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.meta.totalPages}
        onPageChange={setPage}
        keyExtractor={(row) => row.id}
        emptyMessage="No students found. Add your first student to get started."
      />

      <ConfirmDialog
        open={!!archiveId}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archive Student"
        description="This student will be marked as archived. Their records will be preserved. You can restore them later."
        confirmLabel="Archive Student"
        loading={archiveMutation.isPending}
        onConfirm={() => {
          if (archiveId) {
            archiveMutation.mutate(archiveId, {
              onSuccess: () => setArchiveId(null),
            });
          }
        }}
      />
    </div>
  );
}
