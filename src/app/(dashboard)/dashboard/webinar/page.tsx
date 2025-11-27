'use client';

export const dynamic = 'force-dynamic';

import { CategoryCoursesPage } from '@/components/dashboard/CategoryCoursesPage';

export default function WebinarPage() {
  return (
    <CategoryCoursesPage
      courseType="WEBINAR"
      title="Webinár"
      description="Élő és visszanézhető online előadások"
    />
  );
}
