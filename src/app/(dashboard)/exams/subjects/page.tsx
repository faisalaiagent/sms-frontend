'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, Plus, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api, attachAuthInterceptor } from '@/lib/api';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
  code?: string;
  totalMarks: number;
  passingMarks: number;
  class: { id: string; name: string };
}

interface Class { id: string; name: string; }

export default function SubjectsPage() {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterClassId, setFilterClassId] = useState('');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [classId, setClassId] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects', filterClassId],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const url = filterClassId ? `/exams/subjects?classId=${filterClassId}` : '/exams/subjects';
      const res = await api.get<{ data: Subject[] }>(url);
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: Class[] }>('/classes');
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  const createSubject = useMutation({
    mutationFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post('/exams/subjects', {
        name, code: code || undefined, classId,
        totalMarks: parseInt(totalMarks) || 100,
        passingMarks: parseInt(passingMarks) || 40,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject created');
      setShowCreate(false);
      setName(''); setCode(''); setClassId('');
      setTotalMarks('100'); setPassingMarks('40');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create subject';
      toast.error(msg);
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      await api.delete(`/exams/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete subject'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/exams"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Subjects</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage subjects per class</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {/* Filter */}
      <div className="w-56">
        <Select value={filterClassId} onValueChange={(v) => setFilterClassId(v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : subjects && subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subject) => (
            <Card key={subject.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.class.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    onClick={() => setDeleteId(subject.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    Total: {subject.totalMarks}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Pass: {subject.passingMarks}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-muted-foreground">No subjects yet.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Subject
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Subject Name *</Label>
              <Input placeholder='e.g. "Mathematics"' value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subject Code</Label>
              <Input placeholder='e.g. "MATH101" (optional)' value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Passing Marks</Label>
                <Input type="number" value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                onClick={() => createSubject.mutate()}
                disabled={createSubject.isPending || !name || !classId}
              >
                {createSubject.isPending ? 'Creating...' : 'Create Subject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Subject"
        description="This will delete the subject. Any marks recorded for this subject will be preserved but inaccessible."
        confirmLabel="Delete"
        loading={deleteSubject.isPending}
        onConfirm={() => { if (deleteId) deleteSubject.mutate(deleteId); }}
      />
    </div>
  );
}
