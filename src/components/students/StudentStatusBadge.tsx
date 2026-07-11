import { Badge } from '@/components/ui/badge';
import { STUDENT_STATUS_LABELS } from '@/constants';

const VARIANT_MAP: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  ARCHIVED: 'secondary',
  TRANSFERRED: 'outline',
};

export function StudentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT_MAP[status] ?? 'secondary'}>
      {STUDENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
