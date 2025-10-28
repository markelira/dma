// Remove static generation to allow dynamic course IDs
// This enables any course ID to work, not just pre-built ones

import ClientCourseDetailPage from './ClientCourseDetailPage'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  
  // Debug: Show course ID
  console.log('🔍 Course page - courseId:', courseId);
  
  return <ClientCourseDetailPage id={courseId} />;
} 