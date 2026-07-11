'use client';

import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants';

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]:     'Dashboard',
  [ROUTES.STUDENTS]:      'Students',
  [ROUTES.STUDENTS_NEW]:  'Add Student',
  [ROUTES.CLASSES]:       'Classes',
  [ROUTES.SECTIONS]:      'Sections',
  [ROUTES.ATTENDANCE]:    'Attendance',
  [ROUTES.FEES]:          'Fees',
  [ROUTES.EXAMS]:         'Exams',
  [ROUTES.ANNOUNCEMENTS]: 'Announcements',
  [ROUTES.REPORTS]:       'Reports',
  [ROUTES.SETTINGS]:      'Settings',
};

export function Topbar() {
  const pathname = usePathname();

  const title =
    PAGE_TITLES[pathname] ??
    // Handle dynamic segments like /students/[id]
    Object.entries(PAGE_TITLES).find(([route]) =>
      pathname.startsWith(route) && route !== ROUTES.DASHBOARD
    )?.[1] ??
    'SMS Portal';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
