'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, Send, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { api, attachAuthInterceptor } from '@/lib/api';
import { toast } from 'sonner';

interface ClassOption { id: string; name: string; }

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audienceType, setAudienceType] = useState<'ALL' | 'CLASS_SPECIFIC'>('ALL');
  const [classId, setClassId] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: ClassOption[] }>('/classes');
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  const { data: recipientEstimate } = useQuery({
    queryKey: ['students-count', audienceType, classId],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const url = audienceType === 'CLASS_SPECIFIC' && classId
        ? `/students?classId=${classId}&status=ACTIVE&limit=1`
        : '/students?status=ACTIVE&limit=1';
      const res = await api.get(url);
      return (res.data as { meta: { total: number } }).meta.total;
    },
    enabled: !!isSignedIn && (audienceType === 'ALL' || !!classId),
  });

  const createMutation = useMutation({
    mutationFn: async (publishNow: boolean) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post('/announcements', {
        title,
        content,
        audienceType,
        classId: audienceType === 'CLASS_SPECIFIC' ? classId : undefined,
        scheduledAt: schedule && scheduledAt ? scheduledAt : undefined,
        sendWhatsApp,
        publishNow,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      router.push('/announcements');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create announcement';
      toast.error(msg);
    },
  });

  const isValid = title.length > 0 && content.length > 0 && (audienceType === 'ALL' || !!classId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/announcements"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Announcement</h2>
          <p className="text-muted-foreground text-sm mt-1">Create and broadcast to parents</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcement Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input placeholder="e.g. Winter Break Schedule" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Content *</Label>
            <Textarea
              placeholder="Write your announcement here..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant={audienceType === 'ALL' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setAudienceType('ALL')}
            >
              All Students
            </Button>
            <Button
              type="button"
              variant={audienceType === 'CLASS_SPECIFIC' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setAudienceType('CLASS_SPECIFIC')}
            >
              Specific Class
            </Button>
          </div>
          {audienceType === 'CLASS_SPECIFIC' && (
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {recipientEstimate !== undefined && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
              This will reach approximately <strong>{recipientEstimate}</strong> student(s)' parents.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="h-4 w-4"
            />
            <div>
              <p className="text-sm font-medium">Send via WhatsApp</p>
              <p className="text-xs text-muted-foreground">Parents will receive this announcement on WhatsApp</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule}
              onChange={(e) => setSchedule(e.target.checked)}
              className="h-4 w-4"
            />
            <div>
              <p className="text-sm font-medium">Schedule for later</p>
              <p className="text-xs text-muted-foreground">Otherwise this will be saved as a draft</p>
            </div>
          </label>

          {schedule && (
            <div className="space-y-2">
              <Label>Scheduled Date & Time</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => createMutation.mutate(false)}
            disabled={!isValid || createMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            onClick={() => createMutation.mutate(true)}
            disabled={!isValid || createMutation.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {createMutation.isPending ? 'Publishing...' : 'Publish Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}
