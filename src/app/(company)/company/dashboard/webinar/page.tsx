'use client';

export const dynamic = 'force-dynamic';

import { CategoryCoursesPage } from '@/components/dashboard/CategoryCoursesPage';

export default function CompanyWebinarPage() {
  return (
    <CategoryCoursesPage
      courseType="WEBINAR"
      title="Webinár"
      description="Interaktív online előadások és workshopok"
    />
  );
}
