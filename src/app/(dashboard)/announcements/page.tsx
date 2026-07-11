'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Plus, Send, Trash2, Megaphone, Users, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api, attachAuthInterceptor } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  audienceType: 'ALL' | 'CLASS_SPECIFIC';
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  sendWhatsApp: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  class?: { name: string };
  createdBy: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-green-100 text-green-700',
};

export default function AnnouncementsPage() {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const [publishId, setPublishId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: Announcement[] }>('/announcements');
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post(`/announcements/${id}/publish`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success(data.message);
      setPublishId(null);
    },
    onError: () => toast.error('Failed to publish announcement'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete announcement'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Create and broadcast announcements to parents via WhatsApp.
          </p>
        </div>
        <Button asChild>
          <Link href="/announcements/new">
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      <Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge>
                      {a.sendWhatsApp && (
                        <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {a.audienceType === 'ALL' ? (
                          <><Users className="h-3 w-3" /> All Students</>
                        ) : (
                          <><School className="h-3 w-3" /> {a.class?.name}</>
                        )}
                      </span>
                      <span>·</span>
                      <span>by {a.createdBy?.name}</span>
                      {a.publishedAt && (
                        <>
                          <span>·</span>
                          <span>Published {formatDate(a.publishedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.status !== 'PUBLISHED' && (
                      <Button size="sm" onClick={() => setPublishId(a.id)}>
                        <Send className="h-3 w-3 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
            <Megaphone className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
            <Button asChild>
              <Link href="/announcements/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Announcement
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!publishId}
        onOpenChange={(open) => !open && setPublishId(null)}
        title="Publish Announcement"
        description="This will publish the announcement. If WhatsApp was enabled, all matching parents will be notified."
        confirmLabel="Publish"
        variant="default"
        loading={publishMutation.isPending}
        onConfirm={() => { if (publishId) publishMutation.mutate(publishId); }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Announcement"
        description="This will permanently delete this announcement."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
      />
    </div>
  );
}
