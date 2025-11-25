'use client';

import { CategoryCoursesPage } from '@/components/dashboard/CategoryCoursesPage';

export default function MasterclassPage() {
  return (
    <CategoryCoursesPage
      courseType="MASTERCLASS"
      title="Masterclass"
      description="Exkluzív, mélyreható tanfolyamok szakértőktől"
    />
  );
}
