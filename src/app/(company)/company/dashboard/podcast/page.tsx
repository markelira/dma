'use client';

import { CategoryCoursesPage } from '@/components/dashboard/CategoryCoursesPage';

export default function CompanyPodcastPage() {
  return (
    <CategoryCoursesPage
      courseType="PODCAST"
      title="Podcast"
      description="Inspiráló beszélgetések és interjúk szakértőkkel"
    />
  );
}
