'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api, attachAuthInterceptor } from '@/lib/api';
import { getInitials, formatDateTime } from '@/lib/utils';
import { School, User, Shield, MessageCircle } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user: { name: string };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-gray-100 text-gray-700',
};

export default function SettingsPage() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get('/auth/me');
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  const { data: whatsappLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['whatsapp-logs'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get('/whatsapp/logs');
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  const queuedCount = (whatsappLogs as Array<{ status: string }> | undefined)?.filter((l) => l.status === 'QUEUED').length ?? 0;
  const sentCount = (whatsappLogs as Array<{ status: string }> | undefined)?.filter((l) => l.status === 'SENT' || l.status === 'DELIVERED').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Account, school configuration, and system information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Admin account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Admin Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{getInitials(user?.fullName ?? 'Admin')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.fullName ?? 'School Admin'}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                <Badge variant="secondary" className="mt-1">{me?.role?.name ?? 'ADMIN'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <School className="h-5 w-5 text-purple-500" />
              School Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> My School</p>
            <p><span className="text-muted-foreground">System:</span> SMS Admin Portal v1.0</p>
            <p className="text-xs text-muted-foreground pt-2">
              School profile editing coming in a future update.
            </p>
          </CardContent>
        </Card>

        {/* WhatsApp status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{queuedCount}</p>
                <p className="text-xs text-muted-foreground">Queued</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{sentCount}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-3 border-t mt-3">
              Twilio integration ready — add your credentials in the backend .env to start sending live messages.
            </p>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Your Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {me?.role?.permissions &&
                Object.entries(me.role.permissions)
                  .filter(([, v]) => v === true)
                  .slice(0, 12)
                  .map(([key]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}
                    </Badge>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent WhatsApp activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent WhatsApp Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : whatsappLogs && (whatsappLogs as unknown[]).length > 0 ? (
            <div className="space-y-2">
              {(whatsappLogs as Array<{ id: string; templateName: string; toPhone: string; status: string; createdAt: string }>)
                .slice(0, 10)
                .map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div>
                    <span className="font-medium">{log.templateName.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground ml-2">→ {log.toPhone}</span>
                  </div>
                  <Badge variant={log.status === 'SENT' || log.status === 'DELIVERED' ? 'default' : 'secondary'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No WhatsApp activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
