import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const ACCENT_CLASSES = {
  blue:   'border-l-blue-500   bg-blue-50   dark:bg-blue-950/20',
  green:  'border-l-green-500  bg-green-50  dark:bg-green-950/20',
  amber:  'border-l-amber-500  bg-amber-50  dark:bg-amber-950/20',
  red:    'border-l-red-500    bg-red-50    dark:bg-red-950/20',
  purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20',
};

const ICON_CLASSES = {
  blue:   'text-blue-600',
  green:  'text-green-600',
  amber:  'text-amber-600',
  red:    'text-red-600',
  purple: 'text-purple-600',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading = false,
  accent = 'blue',
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="border-l-4 border-l-muted">
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-l-4', ACCENT_CLASSES[accent])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn('mt-1', ICON_CLASSES[accent])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
