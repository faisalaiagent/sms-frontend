'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import {
  LayoutDashboard,
  Users,
  School,
  ClipboardList,
  Banknote,
  PenLine,
  Megaphone,
  BarChart3,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD,     label: 'Dashboard',     icon: LayoutDashboard },
  { href: ROUTES.STUDENTS,      label: 'Students',      icon: Users },
  { href: ROUTES.CLASSES,       label: 'Classes',       icon: School },
  { href: ROUTES.ATTENDANCE,    label: 'Attendance',    icon: ClipboardList },
  { href: ROUTES.FEES,          label: 'Fees',          icon: Banknote },
  { href: ROUTES.EXAMS,         label: 'Exams',         icon: PenLine },
  { href: ROUTES.ANNOUNCEMENTS, label: 'Announcements', icon: Megaphone },
  { href: ROUTES.REPORTS,       label: 'Reports',       icon: BarChart3 },
  { href: ROUTES.SETTINGS,      label: 'Settings',      icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            S
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">SMS Portal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === ROUTES.DASHBOARD
                ? pathname === href
                : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile at bottom */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">School Admin</p>
            <p className="text-xs text-muted-foreground truncate">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
