'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, Plus, Trash2, Send, CheckCircle } from 'lucide-react';
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
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface ExamTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  academicYear: { name: string };
}

interface AcademicYear { id: string; name: string; isCurrent: boolean; }

export default function ExamTermsPage() {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: AcademicYear[] }>('/academic-years');
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  const currentYear = academicYears?.find((y) => y.isCurrent);

  const createTerm = useMutation({
    mutationFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post('/exams/terms', {
        name, startDate, endDate, academicYearId: currentYear?.id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-terms'] });
      toast.success('Exam term created');
      setShowCreate(false);
      setName(''); setStartDate(''); setEndDate('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create exam term';
      toast.error(msg);
    },
  });

  const deleteTerm = useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      await api.delete(`/exams/terms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-terms'] });
      toast.success('Exam term deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete exam term'),
  });

  const publishTerm = useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.patch(`/exams/terms/${id}/publish`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exam-terms'] });
      toast.success(data.message);
      setPublishId(null);
    },
    onError: () => toast.error('Failed to publish results'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/exams"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Exam Terms</h2>
          <p className="text-muted-foreground text-sm mt-1">Create and manage exam periods</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Exam Term
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : terms && terms.length > 0 ? (
        <div className="space-y-3">
          {terms.map((term) => (
            <Card key={term.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{term.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(term.startDate)} → {formatDate(term.endDate)} · {term.academicYear?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={term.isPublished ? 'default' : 'secondary'}>
                    {term.isPublished ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Published</>
                    ) : 'Draft'}
                  </Badge>
                  {!term.isPublished && (
                    <Button size="sm" variant="outline" onClick={() => setPublishId(term.id)}>
                      <Send className="h-3 w-3 mr-1" />
                      Publish Results
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(term.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-muted-foreground">No exam terms yet.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Exam Term
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Exam Term</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Term Name *</Label>
              <Input placeholder='e.g. "Mid-Term 2026"' value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            {currentYear && (
              <p className="text-xs text-muted-foreground">Academic Year: <strong>{currentYear.name}</strong></p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                onClick={() => createTerm.mutate()}
                disabled={createTerm.isPending || !name || !startDate || !endDate || !currentYear}
              >
                {createTerm.isPending ? 'Creating...' : 'Create Term'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!publishId}
        onOpenChange={(open) => !open && setPublishId(null)}
        title="Publish Results"
        description="This will mark the exam term as published and send WhatsApp notifications to all parents whose children have marks recorded for this term. This cannot be undone."
        confirmLabel="Publish & Notify Parents"
        variant="default"
        loading={publishTerm.isPending}
        onConfirm={() => { if (publishId) publishTerm.mutate(publishId); }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Exam Term"
        description="This will delete the exam term. Any marks recorded for this term will be preserved but inaccessible."
        confirmLabel="Delete"
        loading={deleteTerm.isPending}
        onConfirm={() => { if (deleteId) deleteTerm.mutate(deleteId); }}
      />
    </div>
  );
}
